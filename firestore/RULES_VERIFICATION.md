# Manual verification: Studio Firestore rules patch

Automated emulator-backed rules tests (`@firebase/rules-unit-testing`) are
not runnable in this environment — the package isn't installed and there is
no Java runtime available (`firebase emulators:start` requires one). This
sandbox check confirmed both:

```
$ ls node_modules/@firebase/rules-unit-testing
not installed
$ java -version
Unable to locate a Java Runtime.
```

Until a Java runtime + `@firebase/rules-unit-testing` are available (e.g. in
CI or on a dev machine with Java installed), verify the following manually
against a real or emulated `renni-dev` project using the Firebase console
Rules Playground, or by exercising the app with two test accounts (one
`studioRole: 'student'`, one `studioRole: 'coach'` or `'admin'`, sharing a
cohort).

## 1. Student can never self-approve a portfolio artifact

`match /portfolioArtifacts/{id}`, student update branch.

- Sign in as a student who owns a `draft` or `needs_review` artifact.
- Attempt `update` with `coachStatus: 'approved'` (and only fields already
  in the allowed set, e.g. `title`, `updatedAt`).
- **Expect: denied.** Before this patch this was allowed because the rule
  only checked the artifact's *current* `coachStatus`, not the *new* one.
- Attempt the same update with `coachStatus: 'needs_review'` (a legal
  self-transition).
- **Expect: allowed.**
- As the coach, attempt `update` with `coachStatus: 'approved'`.
- **Expect: allowed** (coach branch is unaffected by this patch).

## 2. Non-enrolled signed-in users can't create Studio docs

`studentMissionProgress`, `worksheetResponses`, `portfolioArtifacts` create
rules.

- Sign in with a Google account that has **no** `studentProfiles/{uid}` doc
  (i.e. never provisioned via `studioRoster`, so `isStudioEnrolled()` is
  false) but is otherwise a valid Firebase Auth user.
- Attempt to `create` a doc in each of the three collections with
  `studentUid` set to that user's own uid.
- **Expect: denied** in all three cases.
- Repeat as an enrolled student (has a `studentProfiles/{uid}` doc).
- **Expect: allowed**, same as before this patch.

## 3. Worksheet responses: students can't rewrite identity/lineage fields

`match /worksheetResponses/{id}`, student update branch.

- Sign in as the owning student on an existing worksheet response.
- Attempt an update that only touches `rawInputs`, `aiOutputs`,
  `selectedOutput`, `version`, `updatedAt`.
- **Expect: allowed.**
- Attempt an update that also touches `studentUid` (reassigning the doc to
  a different student), `missionId`, `worksheetType`, or `createdAt`.
- **Expect: denied**, even if `rawInputs` etc. are also present in the same
  write. Before this patch this was allowed because the update rule had no
  `affectedKeys()` restriction at all.
- Confirm `delete` by the owning student still works (unchanged by this
  patch — delete was split out from update but the predicate is the same).

## 4. Regression: existing allowed paths still work

- Admin: full read/write across all four Studio collections above,
  regardless of enrollment/ownership — unaffected by this patch.
- Coach: `studentMissionProgress` and `portfolioArtifacts` coach-feedback
  update branches — unaffected field lists, still gated by
  `isCoachForStudent()`.
- Student: create a new `portfolioArtifacts` doc with `coachStatus: 'draft'`
  while enrolled — still allowed (the `isStudioEnrolled()` addition is
  satisfied by any enrolled student, it doesn't narrow the existing
  ownership/status checks).

## When emulator testing becomes available

Once Java + `@firebase/rules-unit-testing` are installed, the checks above
should become an automated suite (e.g.
`app/__tests__/studio/firestoreRules.test.ts` using
`firebase.json`'s `firestore.rules` path) run via
`firebase emulators:exec`, rather than manual console checks.
