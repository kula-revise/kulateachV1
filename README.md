# Kula Teach with a live coach

This folder is the prototype plus one small server file.

- `index.html` is the prototype. It is the same file as `kula-teach.html` in the project.
- `api/mentor.js` is the server. It holds the coach's instructions and talks to Claude.

## How it works

1. A teacher taps "Talk it through". The prototype sends the conversation and the lesson details to `/api/mentor`.
2. `mentor.js` adds your secret API key and the coach's instructions, and asks Claude.
3. Claude's reply goes back to the prototype, which shows it.

The key never reaches the teacher's phone. If the server fails, the prototype uses its built-in coach, so nothing breaks.

## Set it up

1. Get an API key. In the Claude Console, create an API key and copy it. Set a small monthly spend limit while you test.
2. Put this folder on GitHub. Create a new private repository and upload `index.html`, `README.md` and the `api` folder. The `api` folder must keep its name.
3. Connect it to Vercel. Create a Vercel account, add a new project, and import the repository. No build settings are needed.
4. Add the key. In the project's settings, add an environment variable named `ANTHROPIC_API_KEY` and paste the key as its value. Redeploy the project so it picks up the key.
5. Open the address Vercel gives you. It ends in `vercel.app`.

## Check it is working

- Open `your-address.vercel.app/api/mentor` in a browser. You should see "The Kula coach is here." That means the server file is running.
- In the prototype, finish a lesson, save the ratings and tap "Talk it through". The top of the screen says "With your coach · live" when the reply came from Claude.
- If it doesn't say "live", open the project's Logs in Vercel. A line starting "Kula coach error:" tells you what went wrong. The most common causes are a missing key or a project that wasn't redeployed after the key was added.

## Things to try changing

Each is marked `>>> CHANGE ME` in `api/mentor.js`. Edit the file on GitHub and Vercel redeploys by itself.

1. The model. A smaller model is faster and cheaper.
2. The coach's instructions. They are plain English. Change a rule, save, and see how the coach's replies change.
3. How many replies the coach gives before it wraps up.

## What is live and what is not

- Live: "Talk it through", and the reminders for a focus typed in your own words.
- Not live yet: the messages straight after the ratings. Those are still written lines in `index.html`.

## Before testing with real teachers

Teachers' reflections are sent to the AI service to get a reply. The project's rule is that reflections are private and are not used for training. Check the service's data terms against that rule, and use test names until you have.
