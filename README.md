
```markdown
# QA AI Level-3 - Playwright + Agentic RCA Project

Welcome to the QA Automation Project for [Automation Exercise](https://automationexercise.com). 

This project is designed to automatically test the Automation Exercise website (both the user interface and its APIs) to ensure it is working correctly. It checks things like logging in, adding items to the cart, checking out, and verifying that the background API endpoints respond correctly.

This guide is written for **absolute beginners**. If you have never run an automation script before, follow this step-by-step guide, and you will be able to run the tests yourself.

---

## Part 1: Prerequisites (What you need to install first)

Before you can run the tests, you need three free tools installed on your computer.

### 1. Node.js
Node.js is the engine that runs our test code. 
*   Go to [https://nodejs.org](https://nodejs.org).
*   Download the **LTS (Long Term Support)** version (Recommended for most users).
*   Run the installer and click "Next" through all the default options.
*   *Note: If you are on Windows, ensure "Add to PATH" is selected during installation.*

### 2. Git (Optional, but recommended)
Git is a tool used to save and track changes to code.
*   Go to [https://git-scm.com/downloads](https://git-scm.com/downloads).
*   Download and install the version for your operating system. 

### 3. Visual Studio Code (VS Code)
This is the editor where we will view and run the code.
*   Go to [https://code.visualstudio.com](https://code.visualstudio.com).
*   Download and install it.
*   *Optional but highly recommended:* Once installed, open VS Code, go to the Extensions tab (the blocks on the left), search for **"Playwright Test for VSCode"** by Microsoft, and install it. This gives you a handy "Play" button next to every test.

---

## Part 2: Installation (Setting up the project)

Now that you have the tools, let's install the project's dependencies.

1. Open **VS Code**.
2. Go to `File` > `Open Folder...` and select the `qa-ai-level3` folder you downloaded.
3. Open the Terminal inside VS Code by clicking `Terminal` > `New Terminal` at the top menu (or pressing `` Ctrl + ` ``).
4. In the terminal, type the following command and press Enter:
   ```bash
   npm install
   ```
   *(This will download all the required libraries. It might take a minute or two).*
5. Next, we need to download the browsers Playwright uses. Type this command and press Enter:
   ```bash
   npx playwright install chromium
   ```
   *(This downloads a special version of the Chrome browser used for testing).*

---

## Part 3: How to Run the Tests

Playwright is highly flexible. You can run tests in **Headless mode** (the browser runs invisibly in the background, which is faster) or **Headed mode** (you can watch the browser open and click through the site like a real user).

### 1. Running all tests (Headless)
This is the standard way to run tests. It will run everything without popping up browser windows.
```bash
npx playwright test
```

### 2. Running tests in Headed Mode (Watching the browser)
If you want to watch the browser interact with the website, run:
```bash
npx playwright test --headed
```
*Tip: If you want to slow down the actions so you can actually see them, you can use `--headed --slow-mo=1000` (which adds a 1-second delay between each step).*

### 3. Running only UI tests or only API tests
Our project is split into two types of tests:
*   **UI Tests:** Tests that click around the website in a browser.
*   **API Tests:** Tests that send data directly to the website's backend servers without opening a browser.

To run only the UI tests:
```bash
npx playwright test tests/ui
```
To run only the API tests:
```bash
npx playwright test tests/api
```

### 4. Running a specific Scenario (e.g., "Login")
Every test has a "Tag" or ID (like `AE-02`). If you only want to run the login tests, you can use the `-g` (grep) flag:
```bash
npx playwright test -g "AE-02"
```

### 5. Running the "Smoke Tests" (Quick health check)
"Smoke tests" are the most critical, high-priority tests (like registering an account or making a purchase). If these fail, the website is fundamentally broken.
```bash
npx playwright test --grep @smoke
```

---

## Part 4: Viewing the Results (Reports)

When tests finish running, Playwright doesn't just show text in the terminal; it creates a rich, visual HTML report.

To view the report, run:
```bash
npx playwright show-report
```
This will automatically open a new tab in your web browser. In this report, you can:
*   See how many tests passed (green) or failed (red).
*   Click on a failed test to see the exact error message.
*   Watch a **Video** of the test failing.
*   View **Screenshots** taken right at the moment the test failed.
*   Open the **Trace Viewer**, which lets you pause at any exact frame and inspect the website's HTML code to understand why it failed.

---

## Part 5: Understanding the Project Structure

If you open the folders in VS Code, you'll see the following structure. Here is what each folder does:

```text
qa-ai-level3/
├── .github/workflows/       # CI/CD pipelines (GitHub Actions)
├── config/                  # Environment configurations
├── docs/                    # Documentation (Traceability, Strategy)
├── reports/                 # Output for the AI RCA tool
├── src/                     # The core framework code
│   ├── api/                 # Typed API clients
│   ├── fixtures/            # Setup and teardown logic for tests
│   ├── pages/               # Page Object Models (POM)
│   └── utils/               # Helper functions (logs, math calculations)
├── tests/                   # The actual test scripts
│   ├── ui/                  # Test scripts for the browser
│   └── api/                 # Test scripts for the backend
├── tools/rca/               # The AI Root Cause Analysis tools
├── package.json             # Lists all installed libraries and scripts
├── playwright.config.ts     # The main settings file for Playwright
└── README.md                # This file you are reading
```

### What is a Page Object Model (POM)?
In the `src/pages/` folder, you will see files like `AuthPage.ts` or `CartPage.ts`.
Instead of writing the "click the blue button, then type in the red box" instructions inside every single test, we put those instructions in these Page files. This makes the code much cleaner and easier to maintain.

---

## Part 6: Troubleshooting & Known Issues

**1. I get an error saying "Execution Policy" when running a command in VS Code.**
*   *Fix:* Open PowerShell as an Administrator and run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted`. Click 'Yes' when prompted.

**2. The website is blocked or returning a "Queue Full" page.**
*   *Cause:* Automation Exercise is a public practice site. Sometimes it gets overloaded with too many bots. 
*   *Fix:* Wait a few hours and try again. Our tests are written correctly; the public website is just having a bad day.

**3. The tests fail with "TimeoutError" or "Element not found".**
*   *Cause:* The website developers might have changed the design (e.g., changing a button name from "Submit" to "Send"). Because this is a live public site, it changes without warning.
*   *Fix:* Use the Trace Viewer (Part 4) to look at the screenshot of the failure, and update the locator in the respective Page Object file.

**4. I want to see what the AI RCA (Root Cause Analysis) tool does.**
*   *Cause:* When a test fails, we want to automatically collect logs.
*   *Fix:* Run `npm run rca:collect`. This will scan the test results and generate a JSON report in the `reports/rca/` folder explaining what went wrong (e.g., distinguishing between a real bug and a site timeout).

---

## Summary of Useful Commands (Cheat Sheet)

| Action | Command |
| :--- | :--- |
| Install dependencies | `npm install` |
| Run all tests invisibly (Headless) | `npx playwright test` |
| Run all tests visibly (Headed) | `npx playwright test --headed` |
| Run only API tests | `npx playwright test tests/api` |
| Run only Smoke tests | `npx playwright test --grep @smoke` |
| Run a specific test (e.g., AE-01) | `npx playwright test -g "AE-01"` |
| View the test results report | `npx playwright show-report` |
| Run the RCA failure collector | `npm run rca:collect` |
```