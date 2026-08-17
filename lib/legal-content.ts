/**
 * Shared legal content for Privacy Policy and Terms of Service modals.
 * Used by both the landing-page and login-modal legal modals.
 */

export interface LegalSection {
  title: string;
  body: string;
  /** Optional bullet-point items displayed below the body paragraph */
  items?: string[];
}

export const privacySections: LegalSection[] = [
  {
    title: "I. Information We May Collect",
    body: "Depending on how you use QUICKPAWN, we may collect or process:",
    items: [
      "Name and contact information",
      "Account and login information",
      "Business and user information",
      "Customer and transaction information entered into the Platform",
      "Pawn, payment, loan, renewal, and redemption records",
      "Device, browser, log, and technical information",
      "Other information necessary to provide and operate the Service",
    ],
  },
  {
    title: "II. How We Use Information",
    body: "Information may be used to:",
    items: [
      "Provide, operate, and maintain QUICKPAWN",
      "Create and manage user accounts",
      "Process and manage transactions",
      "Provide customer and technical support",
      "Maintain system security and prevent unauthorized access, fraud, and abuse",
      "Improve and develop the Service",
      "Perform backups and business continuity activities",
      "Comply with applicable laws and legal obligations",
      "Perform other purposes reasonably necessary to provide the Service",
    ],
  },
  {
    title: "III. Customer Data",
    body: 'Information entered into QUICKPAWN by a subscribing pawnshop or business ("Customer Data") generally remains under the control and ownership of that customer. The customer is responsible for ensuring that personal information entered into QUICKPAWN is collected and processed lawfully and in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable laws. Inspire may process Customer Data as necessary to provide, maintain, secure, support, and operate QUICKPAWN. Where applicable, the customer may act as the Personal Information Controller, while Inspire may act as a Personal Information Processor processing data on the customer\u2019s behalf.',
  },
  {
    title: "IV. Data Sharing and Service Providers",
    body: "We may share or provide access to information only as reasonably necessary to operate QUICKPAWN, including with authorized service providers such as hosting, cloud infrastructure, security, communication, payment, and other technology providers. We may also disclose information when required by law, legal process, or a lawful government request, or when reasonably necessary to protect the rights, property, security, and operation of Inspire, QUICKPAWN, our customers, or other persons. We do not sell personal information for purposes unrelated to providing or operating our services.",
  },
  {
    title: "V. Data Security",
    body: "We implement reasonable technical, organizational, and administrative measures designed to protect personal information against unauthorized access, disclosure, alteration, loss, destruction, or unlawful processing. However, no system, network, or electronic transmission can guarantee absolute security. Users and customers are also responsible for protecting their account credentials and limiting access to authorized individuals.",
  },
  {
    title: "VI. Data Retention",
    body: "We retain information only for as long as reasonably necessary to provide the Service, fulfill legitimate business purposes, comply with legal obligations, resolve disputes, enforce agreements, maintain records, and protect our legitimate interests. After an account or subscription ends, Customer Data may be retained or deleted in accordance with applicable retention practices, legal requirements, and the applicable Terms of Service.",
  },
  {
    title: "VII. Data Subject Rights",
    body: "Subject to applicable law, data subjects may have rights under the Data Privacy Act of 2012, including the right to be informed, access, correct, object to certain processing, request erasure or blocking where applicable, and lodge a complaint with the National Privacy Commission. Requests relating to personal information should generally first be directed to the relevant customer or organization that collected the information. Requests relating to personal information directly controlled by Inspire may be sent to the contact details below.",
  },
  {
    title: "VIII. Cookies and Technical Information",
    body: "QUICKPAWN and related websites may use cookies, logs, and similar technologies to support functionality, security, authentication, performance, and system improvement. You may be able to control certain cookie settings through your browser or device. Disabling certain technologies may affect the availability or functionality of some features.",
  },
  {
    title: "IX. Changes to This Privacy Policy",
    body: "We may update this Privacy Policy from time to time to reflect changes in our services, practices, technology, or legal requirements. The updated version will be posted on the QUICKPAWN website with its updated effective date. Your continued use of QUICKPAWN after an updated Privacy Policy becomes effective constitutes your acknowledgment of the updated Policy.",
  },
  {
    title: "X. Contact Information",
    body: "Inspire Next Global Inc.\nName: Inspire Neo\nEmail: inquire.quickpawn.pms@gmail.com\nContact Number: 09929718800\nAddress: 6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig",
  },
];

export const termsSections: LegalSection[] = [
  {
    title: "I. The QUICKPAWN Service",
    body: "QUICKPAWN is a cloud-based pawnshop management system designed to help businesses manage operations such as customer records, pawn transactions, pawned items, loans, payments, renewals, redemptions, reports, and other available features. The features available to you may depend on your selected subscription plan. QUICKPAWN is a business management tool and does not provide legal, accounting, tax, financial, valuation, appraisal, or regulatory advice. You remain responsible for your business operations, decisions, records, and compliance with applicable laws.",
  },
  {
    title: "II. Account Registration and Security",
    body: "You must provide accurate and complete information when creating an account. You are responsible for:",
    items: [
      "Maintaining the confidentiality of your login credentials",
      "Ensuring that only authorized users access your account",
      "Keeping your account information accurate and updated",
      "All activities conducted through your account",
    ],
  },
  {
    title: "III. Subscription and Right to Use",
    body: "Subject to these Terms and payment of applicable fees, Inspire grants you a limited, non-exclusive, non-transferable, non-sublicensable right to access and use QUICKPAWN during your active subscription solely for your internal business operations. You do not receive ownership of QUICKPAWN, its software, source code, design, interface, trademarks, or other intellectual property. You may not copy, modify, reverse engineer, resell, sublicense, distribute, or use QUICKPAWN to create or operate a competing product.",
  },
  {
    title: "IV. Fees and Payment",
    body: "You agree to pay the subscription fees applicable to your selected plan. Fees, billing frequency, user limits, feature limits, and other subscription conditions will be stated in the applicable pricing plan, order, invoice, or written agreement. Unless otherwise stated:",
    items: [
      "Fees are payable according to the selected billing schedule",
      "Applicable taxes and government charges may apply",
      "Subscription fees are non-refundable except where required by law or expressly agreed in writing",
      "Failed or overdue payments may result in restricted or suspended access",
    ],
  },
  {
    title: "V. Customer Data",
    body: "\u201CCustomer Data\u201D means information, records, files, personal information, transaction information, and other data submitted to or stored in QUICKPAWN by or on behalf of the Customer. As between the parties, you retain your rights and ownership interests in Customer Data. You are responsible for:",
    items: [
      "The accuracy and legality of Customer Data",
      "Having the necessary rights and authority to provide Customer Data to QUICKPAWN",
      "Complying with applicable privacy and data protection laws",
      "Ensuring that your collection and use of personal information is lawful",
    ],
  },
  {
    title: "VI. Data Privacy",
    body: "The use of QUICKPAWN may involve the processing of personal information. Inspire Next Global Inc. and its customers agree to comply with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable Philippine data privacy laws and regulations. Customers are responsible for ensuring that personal information entered into QUICKPAWN is collected and processed lawfully. Inspire Next Global Inc. will take reasonable measures to protect information processed through the Service. For more information about how personal information is handled, please refer to the QUICKPAWN Privacy Policy.",
  },
  {
    title: "VII. Acceptable Use",
    body: "You must use QUICKPAWN only for lawful business purposes. You must not:",
    items: [
      "Use QUICKPAWN for unlawful, fraudulent, or abusive activities",
      "Violate applicable laws or the rights of others",
      "Upload viruses, malware, ransomware, or other harmful code",
      "Attempt to gain unauthorized access to QUICKPAWN or related systems",
      "Circumvent security features or usage limitations",
      "Reverse engineer, copy, or modify the Platform",
      "Resell, sublicense, or provide unauthorized access to QUICKPAWN",
      "Use QUICKPAWN to develop or operate a competing service",
    ],
  },
  {
    title: "VIII. Service Availability and Changes",
    body: "Inspire will use reasonable efforts to maintain QUICKPAWN. However, the Service may occasionally be unavailable due to maintenance, upgrades, technical issues, internet or third-party service failures, cybersecurity incidents, or events beyond Inspire\u2019s reasonable control. Inspire may update, modify, improve, or discontinue features of QUICKPAWN from time to time. Unless otherwise agreed in writing, Inspire does not guarantee uninterrupted or error-free operation of the Service.",
  },
  {
    title: "IX. Suspension and Termination",
    body: "Inspire may suspend or restrict access to QUICKPAWN if reasonably necessary to protect the security or integrity of the Service, prevent fraud, abuse, or unauthorized access, address a serious violation of these Terms, comply with applicable law, or address unpaid fees. You may cancel your subscription according to the applicable cancellation procedure. Upon termination or expiration of your subscription:",
    items: [
      "Your right to use QUICKPAWN ends",
      "Access to your account may be disabled",
      "Unpaid fees remain payable",
      "Customer Data may be retained or deleted in accordance with Inspire\u2019s applicable data retention practices and legal obligations",
    ],
  },
  {
    title: "X. Intellectual Property",
    body: "QUICKPAWN and all related software, technology, design, content, documentation, trademarks, logos, and branding are owned by or licensed to Inspire Next Global Inc. You retain ownership of your Customer Data. You may not use Inspire or QUICKPAWN trademarks, logos, or branding without prior written permission.",
  },
  {
    title: "XI. Disclaimers",
    body: "To the maximum extent permitted by law, QUICKPAWN is provided on an \u201CAS IS\u201D and \u201CAS AVAILABLE\u201D basis. Inspire does not guarantee that:",
    items: [
      "The Service will always be uninterrupted",
      "The Service will be error-free",
      "All defects will be corrected",
      "QUICKPAWN will meet every specific business requirement",
      "Use of QUICKPAWN alone will ensure compliance with any law or regulation",
    ],
  },
  {
    title: "XII. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, Inspire will not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, business opportunities, goodwill, data, or business interruption. To the maximum extent permitted by law, Inspire\u2019s total aggregate liability arising out of or relating to QUICKPAWN or these Terms will not exceed the total subscription fees actually paid by the Customer to Inspire for QUICKPAWN during the twelve (12) months preceding the event giving rise to the claim. Nothing in these Terms limits liability that cannot legally be limited or excluded.",
  },
  {
    title: "XIII. Customer Indemnification",
    body: "To the extent permitted by law, you agree to defend, indemnify, and hold harmless Inspire, its affiliates, officers, directors, employees, contractors, and representatives from claims, damages, liabilities, costs, and expenses arising from:",
    items: [
      "Your breach of these Terms",
      "Your misuse of QUICKPAWN",
      "Your violation of applicable law",
      "Your Customer Data",
      "Your violation of another person\u2019s rights",
      "Your business operations and transactions",
    ],
  },
  {
    title: "XIV. Confidentiality",
    body: "Each party agrees to protect the other party\u2019s confidential information and use it only for purposes related to the business relationship. This obligation does not apply to information that is publicly available, already lawfully known, independently developed, or required to be disclosed by law.",
  },
  {
    title: "XV. Changes to These Terms",
    body: "Inspire may update these Terms from time to time. Updated Terms may be posted on the QUICKPAWN website or provided through the Platform, email, or other reasonable means. If you continue to use QUICKPAWN after the updated Terms become effective, you agree to the revised Terms.",
  },
  {
    title: "XVI. Governing Law and Disputes",
    body: "These Terms are governed by the laws of the Republic of the Philippines. The parties will first attempt in good faith to resolve disputes through discussion and negotiation. If a dispute cannot be resolved, the parties may pursue remedies available under applicable Philippine law before the proper courts with jurisdiction.",
  },
  {
    title: "XVII. Contact Information",
    body: "Inspire Next Global Inc.\nName: Inspire Neo\nEmail: inquire.quickpawn.pms@gmail.com\nContact Number: 09929718800\nAddress: 6F Alliance Global Tower, Uptown Mall, Bonifacio Global City, Taguig",
  },
];

export const privacyModalContent = {
  title: "Privacy Policy",
  ariaLabel: "Close privacy policy",
  intro:
    'This Privacy Policy explains how Inspire Next Global Inc. ("Inspire," "we," "us," or "our") collects, uses, stores, and protects personal information in connection with the QUICKPAWN Pawnshop Management System ("QUICKPAWN," "Service," or "Platform"). By accessing or using QUICKPAWN, you acknowledge this Privacy Policy.',
  lastUpdated: "August 2026",
  sections: privacySections,
  footer: "QUICKPAWN Pawnshop Management System (2026). All rights reserved.",
};

export const termsModalContent = {
  title: "Terms of Service",
  ariaLabel: "Close terms of service",
  intro:
    'These Terms of Service ("Terms") govern your access to and use of the QUICKPAWN Pawnshop Management System ("QUICKPAWN," "Service," or "Platform"), a software-as-a-service platform owned and operated by Inspire Next Global Inc. ("Inspire," "we," "us," or "our"). By accessing or using QUICKPAWN, you agree to comply with these Terms of Service. If you are using QUICKPAWN on behalf of a business or organization, you confirm that you have the authority to do so on its behalf. If you do not agree to these Terms, you must not access or use QUICKPAWN.',
  lastUpdated: "August 2026",
  sections: termsSections,
  footer: "QUICKPAWN Pawnshop Management System (2026). All rights reserved.",
};

export const legalModalContent = {
  privacy: privacyModalContent,
  terms: termsModalContent,
};
