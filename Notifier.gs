
/**
 * CONFIG
 * Reads sensitive info from script properties
 */
const props = PropertiesService.getScriptProperties();
const WEBHOOK_URL = props.getProperty('WEBHOOK_URL');
const DOCUMENT_ID = props.getProperty('DOCUMENT_ID');
const PROPERTIES_KEY = props.getProperty('PROPERTIES_KEY') || 'previousTasks';

// Mapping from name in Doc -> Discord ID
const ASSIGNEES = JSON.parse(props.getProperty('ASSIGNEES') || '{}');

/**
 * Main
 */
function checkForNewTasks() {
  const props = PropertiesService.getScriptProperties();
  const previousTasksJSON = props.getProperty(PROPERTIES_KEY);

  Logger.log("--- Script Run Start ---");
  Logger.log(`Previous tasks JSON from properties: ${previousTasksJSON}`);

  const doc = DocumentApp.openById(DOCUMENT_ID);
  const body = doc.getBody();
  const lines = body.getText().split('\n');

  const currentTasks = [];
  let currentName = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (ASSIGNEES.hasOwnProperty(trimmed)) {
      currentName = trimmed;
    } else if (currentName && trimmed !== '') {
      currentTasks.push({
        name: currentName,
        task: trimmed
      });
    }
  });

  Logger.log(`Number of current tasks found in document: ${currentTasks.length}`);
  // Log a sample of current tasks for inspection
  currentTasks.slice(0, 5).forEach((t, i) => Logger.log(`Sample current task ${i + 1}: ${t.name}|${t.task}`));


  if (!previousTasksJSON) {
    Logger.log("First run or no saved tasks. Saving tasks and skipping notifications.");
    props.setProperty(PROPERTIES_KEY, JSON.stringify(currentTasks));
    Logger.log("--- Script Run End (First Run) ---");
    return;
  }

  const previousTasks = JSON.parse(previousTasksJSON);
  const previousSet = new Set(previousTasks.map(t => `${t.name}|${t.task}`));

  Logger.log(`Number of previous tasks loaded: ${previousTasks.length}`);
  // Log a sample of previous tasks for inspection
  Array.from(previousSet).slice(0, 5).forEach((t, i) => Logger.log(`Sample previous task ${i + 1} (from set): ${t}`));


  const newTasks = currentTasks.filter(t => {
    const taskString = `${t.name}|${t.task}`;
    const isNew = !previousSet.has(taskString);
    if (isNew) {
      Logger.log(`Identified as new task: ${taskString}`);
    }
    return isNew;
  });

  if (newTasks.length === 0) {
    Logger.log("No new tasks found.");
  } else {
    Logger.log(`${newTasks.length} new task(s) found. Sending notifications.`);
    newTasks.forEach(t => {
      const userId = ASSIGNEES[t.name];
      sendToDiscord(t.name, t.task, userId);
    });
  }

  props.setProperty(PROPERTIES_KEY, JSON.stringify(currentTasks));
  Logger.log("Current tasks saved for next run.");
  Logger.log("--- Script Run End ---");
}

/**
 * Send to Discord
 */
function sendToDiscord(name, task, userId) {
  // Regular expression to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const foundUrls = task.match(urlRegex);

  let messageContent = `📌 New task for ${name}:\n"${task}"`;

  if (foundUrls && foundUrls.length > 0) {
    // Append the first found URL to the message. You can adjust this to include all if needed.
    messageContent += `\nLink: ${foundUrls[0]}`;
  }

  if (userId) {
    messageContent += `\n<@${userId}>`;
  }

  var payload = {
    "content": messageContent,
    "allowed_mentions": {
      "parse": ["users"]
    }
  };
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
