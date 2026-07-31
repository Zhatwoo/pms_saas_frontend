import React from 'react';

export const GeneralMOATemplate = () => {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-0">
      <div className="text-center mb-8">
        <p className="font-bold">LOGO</p>
        <p className="font-bold uppercase">PAWNSHOP NAME</p>
        <h1 className="text-2xl font-bold mt-4">MEMORANDUM OF AGREEMENT</h1>
        <h2 className="text-lg font-semibold mt-2">PAWN LOAN AGREEMENT</h2>
      </div>
      
      <div className="mb-6 flex justify-between">
        <p className="font-semibold">AGREEMENT NO: _______________________</p>
      </div>

      <div className="space-y-4 text-sm">
        <p>
          This Memorandum of Agreement ("Agreement") is entered into on the ____ day of ____________, 20__, by and between:
        </p>

        <div className="mt-6">
          <p className="font-bold text-center mb-4">PAWNSHOP</p>
          <div className="space-y-2">
            <p><strong>Business Name:</strong> _________________________________________________________________</p>
            <p><strong>Represented by:</strong> _________________________________________________________________</p>
            <p>Hereinafter referred to as the "Pawnshop";</p>
          </div>
        </div>

        <p className="text-center my-4">-and-</p>

        <div className="mt-4 mb-8">
          <p className="font-bold text-center mb-4">CUSTOMER / PAWNER</p>
          <div className="space-y-2">
            <p><strong>Full Name:</strong> _________________________________________________________________</p>
            <p><strong>Address:</strong> _________________________________________________________________</p>
            <p><strong>Contact Number:</strong> _________________________________________________________________</p>
            <p><strong>Government ID Presented:</strong> _________________________________________________________________</p>
            <p><strong>ID Number:</strong> _________________________________________________________________</p>
            <p className="mt-2">Hereinafter referred to as the "Customer." Both parties agree to the following terms and conditions:</p>
          </div>
        </div>

        <h3 className="font-bold text-base mt-6 mb-2">I. PURPOSE</h3>
        <p>The Customer voluntarily pawns the item(s) described below as security for a loan granted by the Pawnshop under the terms of this Agreement.</p>

        <h3 className="font-bold text-base mt-6 mb-2">II. DESCRIPTION OF PAWNED ITEM</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Pawn Ticket No.:</strong> _______________________</p>
          <p><strong>Item Description:</strong> _______________________________________________________</p>
          <p><strong>Brand:</strong> __________________________</p>
          <p><strong>Model:</strong> __________________________</p>
          <p><strong>Serial Number (if applicable):</strong> _______________________</p>
          <p><strong>Accessories Included:</strong> __________________________</p>
          <p className="col-span-1 md:col-span-2"><strong>Condition upon acceptance:</strong> _________________________________________________________________</p>
          <p><strong>Declared/Appraised Value: PHP</strong> _______________________</p>
        </div>

        <h3 className="font-bold text-base mt-6 mb-2">III. LOAN DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Loan Amount: PHP</strong> _______________________</p>
          <p><strong>Interest Rate:</strong> _________% per ___________________</p>
          <p><strong>Service Charges (if any): PHP</strong> _______________________</p>
          <p><strong>Date Pawned:</strong> __________________________</p>
          <p><strong>Maturity Date:</strong> __________________________</p>
          <p><strong>Expiry Date:</strong> __________________________</p>
          <p className="col-span-1 md:col-span-2 font-bold"><strong>Total Amount Required for Redemption: PHP</strong> _______________________</p>
        </div>

        <h3 className="font-bold text-base mt-6 mb-2">IV. CUSTOMER DECLARATIONS</h3>
        <p>The Customer represents and warrants that:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>The pawned item is legally owned by the Customer or that the Customer has full legal authority to pawn the item.</li>
          <li>The item is free from any known legal claims, liens, disputes, or encumbrances.</li>
          <li>All information provided to the Pawnshop is true, accurate, and complete.</li>
          <li>The Customer understands the loan amount, interest, fees, maturity date, and redemption terms.</li>
        </ul>

        <h3 className="font-bold text-base mt-6 mb-2">V. REDEMPTION</h3>
        <p>The Customer may redeem the pawned item upon payment of the total amount due, including the principal loan, accrued interest, and any applicable charges, on or before the applicable redemption period allowed by the Pawnshop and applicable laws.</p>

        <h3 className="font-bold text-base mt-6 mb-2">VI. RENEWAL</h3>
        <p>Subject to the Pawnshop's policies and applicable laws, this loan may be renewed upon payment of the required interest, charges, or other applicable fees.</p>
        <p>Approval of any renewal shall remain at the sole discretion of the Pawnshop.</p>

        <h3 className="font-bold text-base mt-6 mb-2">VII. DEFAULT</h3>
        <p>If the Customer fails to redeem or renew the pawned item within the applicable redemption period, the Pawnshop shall have the rights provided under applicable laws, rules, regulations, and the Pawnshop's policies.</p>

        <h3 className="font-bold text-base mt-6 mb-2">VIII. CUSTOMER RESPONSIBILITY</h3>
        <p>The Customer shall immediately notify the Pawnshop of any correction regarding personal information provided under this Agreement.</p>
        <p>The Customer acknowledges that the Pawnshop relied upon the information provided during this transaction.</p>

        <h3 className="font-bold text-base mt-6 mb-2">IX. DATA PRIVACY ACT</h3>
        <p>The parties acknowledge that personal information collected in connection with this transaction shall be processed in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable laws.</p>
        <p>The Customer authorizes the Pawnshop to collect, record, store, and process personal information solely for purposes related to this pawn transaction, legal compliance, customer verification, record keeping, fraud prevention, and other legitimate business purposes.</p>

        <h3 className="font-bold text-base mt-6 mb-2">X. GOVERNING LAW</h3>
        <p>This Agreement shall be governed by the laws of the Republic of the Philippines.</p>

        <h3 className="font-bold text-base mt-6 mb-2">XI. ENTIRE AGREEMENT</h3>
        <p>This document constitutes the entire agreement between the parties relating to this pawn transaction unless otherwise required by applicable law.</p>
        <p>Any amendments must be made in writing and acknowledged by both parties.</p>

        <div className="mt-12">
          <h3 className="font-bold text-center mb-8">SIGNATURES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            <div>
              <p className="font-bold mb-4">CUSTOMER/PAWNER:</p>
              <p>NAME: _______________________</p>
              <p className="mt-4">SIGNATURE: _______________________</p>
              <p className="mt-4">DATE: _______________________</p>
            </div>
            <div>
              <p className="font-bold mb-4">AUTHORIZE REPRESENTATIVE:<br/><span className="font-normal">(For Pawnshop)</span></p>
              <p>NAME: _______________________</p>
              <p className="mt-4">SIGNATURE: _______________________</p>
              <p className="mt-4">DATE: _______________________</p>
            </div>
            <div className="col-span-1 md:col-span-2 mt-4">
              <p className="font-bold mb-4">WITNESS:<br/><span className="font-normal">(Optional)</span></p>
              <p>NAME: _______________________</p>
              <p className="mt-4">SIGNATURE: _______________________</p>
              <p className="mt-4">DATE: _______________________</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
