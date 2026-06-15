# Botswana Nurses Union (BONU)

## Current Application Requirements and Business Rules

**Document status:** Current implemented baseline  
**Last updated:** 15 June 2026

## 1. Introduction

The BONU digital platform supports member registration, profile management,
membership onboarding, membership payments, service applications, complaints,
merchandise requests, and application tracking.

The platform consists of:

1. **Member Portal:** Used by BONU members to maintain profiles, complete
   onboarding, pay membership fees, submit applications, upload documents, and
   track requests.
2. **CSR Portal:** Used by Customer Service Representatives to review members,
   verify documents, process applications and payments, manage complaints, and
   monitor operational activity.
3. **Administration Portal:** Used by authorised administrators for staff-user
   management and functions outside the CSR role.

## 2. Authentication and Registration

The system shall allow users to:

- Register a member account.
- Sign in using an email address and password.
- Request a password reset.
- Update a password through a valid reset link.
- Sign out securely.
- Access only the portal permitted by their assigned role.

New member accounts shall begin with a membership status of **Pending
activation**.

## 3. Member Profile

Members shall complete their profiles before continuing with Membership
Onboarding.

The profile captures applicable information including:

- Full name.
- National ID / Omang or passport details.
- Date of birth, gender, marital status, and citizenship status.
- Contact information and addresses.
- District and council.
- Occupation and employment sector.
- Employer, employee number, work station, and department.
- Employment date and monthly salary.
- Supporting profile documents.

When a member with an incomplete profile enters the portal, the system shall
display a mandatory prompt directing the member to complete the profile.
Membership Onboarding shall remain locked until the profile is complete.

## 4. Membership Onboarding

After completing the profile, the member shall complete Membership Onboarding.

Required forms depend on employment sector:

- **Private-sector employee:** Direct Debit Form.
- **Public-sector employee:** Deduction Form.

Members may download the relevant form, complete it, and upload the completed
copy. The platform provides links to Adobe Acrobat Reader for desktop, Android,
and iOS to assist with viewing and completing PDF forms.

Funeral Policy forms are not part of Membership Onboarding. They are managed
separately under Funeral Insurance.

The member shall:

- Select citizenship status.
- Select employment sector.
- Upload all required membership forms.
- Confirm the membership declaration.
- Submit the onboarding application for CSR review.

Only one open Membership Onboarding submission shall be permitted at a time.

CSR may set the application status to:

- Submitted.
- In review.
- More information required.
- Approved.
- Rejected.
- Fulfilled.

## 5. Membership Activation

Membership activation shall follow this workflow:

1. The member completes the profile.
2. The member submits the required Membership Onboarding forms.
3. CSR reviews the Membership application.
4. The Membership application must be **Approved** or **Fulfilled**.
5. The monthly membership fee is calculated.
6. The fee is paid by the member or recorded through the CSR payment process.
7. Membership becomes **Active** only after successful payment.

The previous requirement to approve at least one billable service before
membership activation no longer applies.

The activation or payment action shall remain disabled until the Membership
Onboarding application is Approved or Fulfilled.

## 6. Membership Fee and Payments

The monthly BONU membership fee shall equal **5% of the member's recorded
monthly salary**.

The system shall:

- Require a valid monthly salary before calculating the fee.
- Generate only one membership-fee charge.
- Prevent duplicate paid membership transactions for the same payment month.
- Record the payment month, amount, source, status, and payment date.
- Display payment history to the member.
- Activate or reactivate an eligible member after successful payment.

Payment sources currently supported are:

- Member portal payment flow.
- CSR bulk-payment import.

The membership fee is independent of deductions for other service applications
and is not calculated from a combined total of approved services.

## 7. Member Access Control

Members with incomplete profiles shall be directed to complete their profiles.

Members whose membership status is not Active shall not access restricted
services, including:

- New service applications.
- Merchandise Shop.
- Electronic Contracts.
- Bundles.

Locked menu items shall indicate that membership activation is required.

The member navigation shall display horizontally on larger screens and collapse
into an accessible menu on mobile phones and tablets. Active-page indicators and
locked-service rules shall apply at all screen sizes.

Profile, membership, and permitted account-management functions shall remain
available as required to complete activation.

## 8. Funeral Insurance

Funeral Insurance onboarding shall be managed separately from Membership
Onboarding.

The member shall:

- Complete and upload the Funeral Policy Form.
- Provide funeral-cover application information.
- Upload supporting documents.
- Track the application status.

The Additional Member Funeral Form is optional unless the member is adding
dependants, beneficiaries, extended family, or other additional covered members.
When additional covered members are included, that form shall be required.

CSR shall be able to review funeral application information and attachments.

## 9. Other Member Services

Active members may submit applications or requests for:

- Legal Aid.
- External Loan Assistance.
- BONU Micro-Lending.
- Merchandise.
- Electronic Contracts.
- Bundles.
- Funeral Insurance.

Each service shall capture the information and documents required by its
application form. Applications may include requested amounts, monthly
deductions, terms, supporting details, attachments, and case updates.

Approval of these services does not replace the separate 5% membership fee.

## 10. Merchandise

Active members may:

- Browse available merchandise.
- Submit merchandise orders.
- Select available payment arrangements.
- Review order information and status.
- Confirm or sign off fulfilled orders where required.

CSR users may add or update products, review orders, record payment or
fulfilment information, and manage order processing.

## 11. Complaints and Case Communication

Members may submit complaints and view complaint progress.

CSR users may review complaints, update their status, and record responses.
Applications may include case-pulse updates for progress comments and
supporting files.

## 12. Member Dashboard and Application Tracking

The Member Portal dashboard shall display relevant information including:

- Membership status.
- Membership-fee information.
- Payment history.
- Application statuses.
- Notifications.
- Current service information where available.

The Application statuses table shall support:

- Searching.
- Sorting directly from supported column headings.
- CSV export of the current searched and sorted results.
- Pagination.
- Opening a detailed application view.

Application details shall include available service, status, requested amount,
monthly deduction, term, submission date, submitted information, case activity,
and uploaded attachments.

Members shall be able to view or download accessible attachments.

## 13. CSR Member and Application Management

CSR users shall be able to:

- View member profiles and membership status.
- Review and verify uploaded documents.
- Review submitted service applications.
- Request additional information.
- Approve, reject, fulfil, or otherwise update application status.
- View application details and attachments.
- Review payment information.
- Process complaints.

CSR shall not activate a pending member unless:

- Membership Onboarding is Approved or Fulfilled.
- A successful membership-fee payment has been recorded.

## 14. CSR Council Payment Templates

CSR users may generate a populated monthly payment template for a selected
Botswana council and payment month.

A member shall be included only when:

- The member belongs to the selected council.
- The Membership application is Approved or Fulfilled.
- The member has a National ID / Omang.
- The member has a valid monthly salary greater than zero.
- The calculated 5% membership fee is greater than zero.

The workbook shall include:

- Member name.
- National ID / Omang.
- Council.
- Email address.
- Phone number.
- Payment month.
- Monthly salary.
- Total membership deduction.

If no eligible records are available, the system shall not generate an empty
template. It shall display a centred error modal explaining that there may be no
eligible records, required information may be missing, or a system error may
have occurred. The modal shall appear above all page content and provide a
dismiss action.

## 15. CSR Bulk-Payment Import

CSR users may upload payment files in CSV, XLS, or XLSX format.

National ID / Omang shall be the primary member-matching key.

The import process shall:

- Match uploaded rows to member records.
- Validate payment month and amount.
- Compare payment against the expected 5% salary-based membership fee.
- Prevent duplicate processing for the same member and month.
- Record valid payment-history entries.
- Activate eligible pending members after payment.
- Reactivate eligible members where applicable.
- Return a detailed row-level processing report.

The report shall identify paid, unmatched, duplicate, invalid, and warning
records.

## 16. CSR Dashboard and Reporting

The CSR dashboard currently provides:

- Member metrics.
- Application workload by status.
- Application volume by service.
- Monthly application trends.
- Payment status metrics.
- Operational processing indicators.

The CSR landing page does not include the former CSR Action Center section.

## 17. Notifications and Feedback

The platform supports in-app notifications and user feedback for relevant events
including registration, profile updates, application updates, membership
payments, document verification, complaints, orders, and errors requiring
corrective action.

Success and error feedback shall use clear, user-friendly messages.

## 18. Security and Role Control

The system shall:

- Require authenticated access to protected pages and APIs.
- Restrict member functions to member accounts.
- Restrict CSR functions to authorised staff.
- Restrict administrator functions to administrators.
- Enforce important business rules on the server.
- Protect member documents through authenticated file endpoints.

## 19. Current External Integrations

The current system supports or provides integration points for:

- Supabase authentication, database, and document storage.
- Stripe-based member payment processing where configured.
- Spreadsheet generation and processing for CSR payments.
- Adobe Acrobat Reader links for viewing and completing PDF forms.

SMS providers, accounting systems, identity verification, direct bank
integration, insurance-provider integration, and legal-partner integration are
not part of the confirmed current implementation.

## 20. Future Enhancements

Potential future enhancements include:

- Native Android and iOS applications.
- Digital membership cards and QR-code verification.
- SMS and expanded email notifications.
- Accounting and direct payroll-deduction integrations.
- Bank and financial-institution integrations.
- Identity-verification services.
- Insurance-provider and legal-partner integrations.
- Document e-signatures.
- Online appointment booking.
- Self-service loan eligibility assessment.
- Expanded revenue, arrears, inventory, and branch reporting.

## 21. Core Business Rules Summary

- A member must complete the profile before Membership Onboarding.
- Membership forms depend on employment sector.
- Funeral forms are handled separately under Funeral Insurance.
- CSR must Approve or Fulfil Membership Onboarding before payment activation.
- The membership fee is 5% of monthly salary.
- Membership becomes Active only after successful payment.
- Approval of another billable service is not required for activation.
- Only one membership-fee charge is calculated.
- Duplicate monthly payments are prevented.
- Inactive members cannot access restricted services.
- Council exports include only eligible members with Approved or Fulfilled
  Membership applications.
- National ID / Omang is used for CSR bulk-payment matching.
- Application details include submitted information and attachments.
- Application tables support search, column sorting, and CSV export.
