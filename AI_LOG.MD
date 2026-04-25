# AI Log - Claims Management System

This document details the working methodology followed using Artificial Intelligence tools and the technical oversight applied to ensure compliance with the exercise requirements.

## 1. Spec-Driven Development (SDD) Strategy

Following the exercise recommendations, AI was used for:

- **Contract Definition:** Generation of the initial OpenAPI (Swagger) schema based on the `Claim` and `Damage` entities.
- **Synchronization:** The contract was used as a "source of truth" for the AI to generate TypeScript types on both the backend and frontend, avoiding discrepancies in data models.

## 2. Backend & Test Quality (Coverage >95%)

To achieve the required 95% coverage, the following approach was taken:

- **Test Generation:** Claude was used to write the boilerplate for unit and integration tests.
- **Oversight and Correction:**
  - All assertion operators (`as`) were manually reviewed to avoid false positives and ensure TypeScript types were correct.
  - The integration test logic was validated to ensure the server-side `Total Amount` calculation correctly summed damage prices.
  - The **Dependency Injection (DI)** pattern was manually implemented to decouple services from controllers, making it easier to use _mocks_ in tests.

## 3. Frontend: Angular 20, Zoneless and Reactivity

The AI tended to generate code based on older versions or standard Angular patterns. Strict technical judgment was applied to modernize the solution:

- **Architecture:** AI-generated code was corrected to implement **ChangeDetectionStrategy.OnPush** and configure the application as **Zoneless**, aligning it with Angular 20 features.
- **Angular Material:** UI components were migrated to the latest Angular Material APIs.
- **Reactive Logic:** The implementation of **Reactive Forms** and state management was overseen so that the `Total Amount` updates in real time in the detail view when damages are added, edited, or deleted.
- **API Interfaces:** Frontend service interfaces were created manually to ensure data mapping between the backend and components was 100% consistent.

## 4. Business Rule Implementation

Special attention was paid to correcting the AI on complex rules:

- **State Restrictions:** Manual validation to ensure damages are only editable when the claim status is `Pending`.
- **Closing Logic:** Implementation of the validation requiring a description longer than 100 characters when a high-severity damage exists, in order to allow the `Finished` status.

## 5. Conclusion

The use of AI accelerated the writing of repetitive code and test scaffolding, but the **final architecture, Angular optimizations, and business rule integrity** were manually overseen and corrected to meet the required standards of scalability and maintainability.
