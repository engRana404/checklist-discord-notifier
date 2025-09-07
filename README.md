# Checklist Discord Notifier

📌 An Apps Script automation that watches a shared Google Doc for new task additions and notifies the assigned team member via Discord webhook.

---

## 🚀 Features

- Automatically parses a Google Doc with member names and their tasks
- Detects new tasks added under each assignee
- Sends real-time notifications to Discord mentioning the responsible member
- Avoids duplicate messages by saving previous state using `PropertiesService`
- Rate-limit friendly

---

## 🛠️ Technologies Used

- Google Apps Script
- Discord Webhook API

---

## 🧩 Setup

1. Open your Google Doc and go to `Extensions > Apps Script`.
2. Paste the content of `Notifier.gs` inside the editor.
3. Add your configuration values to a `.env` file in your project (see example below):

   ```env
   WEBHOOK_URL=your_discord_webhook_url
   DOCUMENT_ID=your_google_doc_id
   PROPERTIES_KEY=previousTasks
   ASSIGNEES={"Name1":"DiscordID1","Name2":"DiscordID2",...}
   ```

4. In the Apps Script dashboard, go to `Project Settings > Script Properties` and manually copy each key-value pair from your `.env` file into Script Properties. This makes your script read all sensitive/configurable info from environment variables.

5. Add a time-based trigger (e.g. every 5 minutes) for `checkForNewTasks`.

