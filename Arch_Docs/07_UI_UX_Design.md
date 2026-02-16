7. UI/UX Design
7.1 Theme
**Initial load (no theme flash):** The root layout must not apply theme-specific styles until the database is ready and the theme has been read from `app_settings` (or a default chosen). Use a minimal loading state (e.g. neutral or light background, no sidebar/navbar) until then. This is documented in [02_Technical_Stack.md](02_Technical_Stack.md) under Storage / Theme and bootstrap.

Colors (Up Bank inspired):
scss// Light Theme
$primary: #FF7A59;      // Up's coral/orange
$secondary: #8B5CF6;    // Purple for savers
$background: #FFFFFF;
$surface: #F7F7F7;
$text: #1A1A1A;
$text-secondary: #6B6B6B;

// Dark Theme
$primary: #FF7A59;
$secondary: #A78BFA;
$background: #121212;
$surface: #1E1E1E;
$text: #FFFFFF;
$text-secondary: #A0A0A0;
Typography:
scss$font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-size-base: 16px;
$font-size-lg: 20px;
$font-size-xl: 28px;

7.2 Layout (Purple React Template)
**Reference:** Layout (sidebar, navbar, main content) can follow the **Purple React** admin template: [ThemeWagon Purple React](https://themewagon.com/themes/purple-react-free-react-bootstrap-4-admin-dashboard-template/), [Live demo](https://themewagon.github.io/purple-react/dashboard). Bootstrap 5 can be used with the same layout ideas.

Sidebar:

Width: 260px (desktop), collapsible to 70px
Fixed position
Dark theme: Dark gray background
Light theme: White background with border

Top Navbar:

Height: 70px
Contains: Menu toggle, Sync button, Theme toggle, User info
Sticky position

Main Content:

Padding: 30px
Max-width: 1400px (for ultra-wide screens)
Responsive grid (Bootstrap 5 or 4)

**7.2.1 Responsive (13"-27" screens, Phase 5):** Target viewports from ~1280px (13") to ~2560px (27"). Main content uses max-width 1400px and is centered; body has overflow-x: hidden to avoid horizontal scroll. Bootstrap breakpoints (e.g. md=768px) apply: Dashboard 3-column stacks on small viewports; at 1280px and above the layout is sidebar + 3 columns. Sidebar auto-collapses when viewport width is below 1280px (see Layout.tsx). Manual testing at 1280px and 2560px is recommended to confirm no overflow and readable text.


7.3 Components
BalanceCard
jsx<Card>
  <Card.Body>
    <h6 className="text-muted">Available</h6>
    <h2 className="mb-0">${formatMoney(available)}</h2>
    <hr />
    <h6 className="text-muted">Spendable</h6>
    <h2 className="text-success">${formatMoney(spendable)}</h2>
    <small className="text-muted">
      ${formatMoney(reserved)} reserved for upcoming
    </small>
  </Card.Body>
</Card>
TrackerCard
jsx<Card>
  <Card.Body>
    <div className="d-flex justify-content-between">
      <h5>{tracker.name}</h5>
      <Badge variant="info">{daysLeft} days</Badge>
    </div>
    <h3 className="text-primary">${formatMoney(remaining)} left</h3>
    <ProgressBar 
      now={progress} 
      variant="primary" 
      label={`${Math.round(progress)}%`}
    />
    <small className="text-muted mt-2">
      ${formatMoney(spent)} of ${formatMoney(budget)} spent
    </small>
  </Card.Body>
</Card>
SaverCard
jsx<Card>
  <Card.Body>
    <div className="d-flex align-items-center mb-3">
      <span className="h2 me-2">{saver.icon}</span>
      <div>
        <h6 className="mb-0">{saver.name}</h6>
        {saver.is_goal_based && (
          <small className="text-muted">
            Target: {formatDate(saver.target_date)}
          </small>
        )}
      </div>
    </div>
    <h4>${formatMoney(saver.current_balance)}</h4>
    {saver.is_goal_based && (
      <>
        <ProgressBar now={progress} variant="success" />
        <small className="text-muted">
          of ${formatMoney(saver.goal_amount)}
        </small>
      </>
    )}
  </Card.Body>
</Card>
```

---

### **7.4 Onboarding Wizard (6 steps)**

**Implementation:** `src/pages/Onboarding.tsx` (6 steps, step state, progress bar on step 5). Unlock screen: `src/pages/Unlock.tsx`. App gating (onboarding vs unlock vs dashboard): `src/App.tsx`.

**Step 1: Welcome**
```
Welcome to Vantura! 🚀

Vantura syncs with your Up Bank account to give you powerful
desktop-based financial insights.

Your data is stored locally and never leaves your device.

[Get Started]
```

**Step 2: Passphrase**
```
Create a passphrase to protect your API token

- Enter passphrase (and confirm). This passphrase protects your API token and is never stored.
- You must enter it each time you open the app to unlock.
- If you forget your passphrase, you will need to re-onboard and create a new API token in Up Bank.

[Passphrase Input] [Confirm Passphrase]
[Continue]
```

**Step 3: API Token**
```
Connect your Up Bank account

1. Log in to Up Bank app; go to Data sharing → Personal Access Token (or Settings → API)
2. Create a new Personal Access Token
3. Copy and paste it below. It will be encrypted with a key derived from your passphrase and never stored in plain form.

[API Token Input]
[Learn more about API tokens]

[Continue]
```

**Step 4: Payday Schedule**
```
When do you get paid?

Frequency: [Dropdown: Weekly, Fortnightly, Monthly]
Day: [Dropdown: Monday, Tuesday, etc. OR 1st, 2nd, etc.]
Next payday: [Date picker]

This helps calculate your Spendable balance.

[Continue]
```

**Step 5: Initial Sync**
```
Syncing your transactions...

[Progress bar]
Fetched 437 transactions...

This may take a minute for large transaction histories.

[Cancel]
```

**Step 6: Complete**
```
All set! 🎉

You're ready to start tracking your finances.

Quick tips:
- Create trackers to monitor spending
- View Spendable to see safe-to-spend amount
- Set saver goals to reach financial targets

[Go to Dashboard]
```

**After onboarding:** On each app open, the user sees an **Unlock** screen (enter passphrase) before accessing the dashboard or syncing. The derived key is kept in memory for the session only. Implemented in `Unlock.tsx`; session token stored in `sessionStore` (memory only) until lock or tab close.