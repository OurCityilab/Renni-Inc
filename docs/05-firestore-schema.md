# Firestore Schema Notes

## users/{uid}
- email
- displayName
- role
- title
- department
- isChief
- createdAt

## deliverables/{deliverableId}
- title
- chapter
- department
- ownerUid
- approverUid
- dueDate
- status
- templateUrl
- definitionOfDone
- rubricChecklist
- linkedDocUrl
- notes

## tasks/{taskId}
- deliverableId
- title
- ownerUid
- status
- startDate
- dueDate
- blockedBy
- dependsOn
- progress

## goals/{goalId}
- department
- metricName
- target
- current
- ownerUid
- status

## bmc/{canvasId}
- sections.{sectionName}.content
- sections.{sectionName}.why
- sections.{sectionName}.ownerUid
- sections.{sectionName}.status
- sections.{sectionName}.lockedByUid

## continuity/{docId}
- sections.{sectionName}.content
- sections.{sectionName}.why
- sections.{sectionName}.ownerUid
- sections.{sectionName}.status
- sections.{sectionName}.lockedByUid

## decisions/{decisionId}
- title
- category
- decision
- rationale
- alternativesConsidered
- expectedOutcome
- decidedByUid
- status
- relatedChapter
- relatedDeliverableId

## pricingScenarios/{scenarioId}
- sku
- price
- unitCost
- estimatedUnitsLow
- estimatedUnitsTarget
- estimatedUnitsHigh
- fixedCostsShare
- notes

## donations/{donationId}
- amount
- sourceType
- paymentMethod
- recordedByUid
- note
- createdAt

## transactions/{transactionId}
- sku
- productName
- quantity
- amount
- paymentType
- sellerUid
- donationAttached
- createdAt

## feedback/{feedbackId}
- customerType
- productInterest
- note
- capturedByUid
- createdAt
