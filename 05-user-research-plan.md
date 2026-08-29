# User research plan

## Principle

Build around observed user work, not a list of requested features. A request such as “Google Drive backup” may represent a deeper need: confidence that device loss or a bad edit will not destroy work. Research identifies the underlying job and tests the simplest safe solution.

## Research questions

1. What causes people to stop using or continually reconfigure Obsidian?
2. Which plugins have become essential, and what job does each perform?
3. What do users believe “local,” “private,” “backup,” and “sync” mean?
4. What information would make them trust a local model download?
5. When would they permit AI to modify notes?
6. Which sources and citation presentation make an AI answer verifiable?
7. What must survive migration for an existing vault to remain useful?
8. What would make a free tool become a weekly habit?
9. What convenience or professional outcome might eventually justify payment?

## Participant groups

Recruit 3–4 participants from each:

- experienced Obsidian users with several plugins;
- people who tried and abandoned Obsidian;
- privacy-sensitive professional users;
- people using simpler tools such as Apple Notes, OneNote, or folders/documents.

Include Windows, macOS, and Linux users and a range of hardware. Do not recruit only developers.

## Interview structure

### Context

- Tell me about the last time you needed information you knew you had saved.
- Show me how you capture something that has no obvious destination.
- Which part of your note system do you maintain manually?

### Failure and trust

- Have you lost work or experienced a conflict?
- How do you know your backup can be restored?
- What information is too sensitive for a hosted AI?
- What would an AI have to show before you let it edit ten notes?

### Switching

- What would have to migrate perfectly?
- Which three capabilities could not be missing?
- What would make installation feel complete?

Avoid asking “Would you use this?” Observe behavior and ask for recent examples.

## Prototype tasks

Without instruction, ask participants to:

1. install the application;
2. create or open a workspace;
3. capture a note with an attachment;
4. find a note from a vague memory;
5. ask a question spanning three notes;
6. verify one claim in the answer;
7. approve only part of an AI-proposed change;
8. configure a backup;
9. restore yesterday’s version into a safe location;
10. determine whether any content left the device.

Capture completion, time, hesitation, error, confidence, and participant language.

## Request intake

Every user request becomes an evidence record:

```text
Request:
Who asked:
Observed job:
Current workaround:
Frequency:
Cost of failure:
Security/privacy impact:
Platforms:
Evidence strength:
Proposed smallest test:
Decision:
```

Votes do not determine priority alone. Favor frequent jobs, high failure cost, broad applicability, and alignment with the product promise.

## Research repository

Keep raw research private and separate from the application repository.

Recommended artifacts:

- interview guide;
- consent and recording status;
- anonymized notes;
- observation clips or screenshots when permitted;
- request evidence table;
- usability scorecards;
- decision summaries;
- assumptions that remain unverified.

Do not place participant names, employer-sensitive material, vault contents, or contact details in public issues.

## Continuous cadence

- five discovery conversations before prototype commitment;
- one usability session per major workflow;
- monthly synthesis of requests and support issues;
- quarterly revisit of target audience and willingness to pay;
- security review whenever AI gains a new action, content type, network destination, or credential.

## Beta feedback prompts

Keep prompts behavioral:

- What were you trying to accomplish?
- What did you expect to happen?
- What happened instead?
- Could you recover?
- Did you know where your data and AI processing were located?

## Decision rule

Do not add a major feature because competitors have it. Add it when user evidence shows that it advances the core promise and the team can support it securely across all three platforms.
