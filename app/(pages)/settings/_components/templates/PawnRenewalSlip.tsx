import React from 'react';

export const PawnRenewalSlipTemplate = () => {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-0">
      <div className="text-center mb-8">
        <p className="font-bold">LOGO</p>
        <p className="font-bold uppercase">PAWNSHOP NAME</p>
        <h1 className="text-2xl font-bold mt-4">PAWN RENEWAL SLIP</h1>
      </div>

      <div className="space-y-4 text-sm mb-8">
        <p><strong>Business Address:</strong> _______________________________________________</p>
        <p><strong>Contact Number:</strong> ________________________________________________</p>
        <p><strong>Email Address:</strong> _________________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">I. RENEWAL SLIP</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Renewal Slip No.: ______________________</p>
        <p>Pawn Ticket No.: _______________________</p>
        <p>Transaction No.: _______________________</p>
        <p>Date & Time: ___________________________</p>
        <p>Processed By: __________________________</p>
      </div>

      <h2 className="font-bold mb-4">II. CUSTOMER INFORMATION</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Customer Name: ___________________________________________</p>
        <p>Address: ________________________________________________</p>
        <p>Contact Number: _________________________________________</p>
        <p>Government ID Presented: ________________________________</p>
        <p>ID Number: _____________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">III. PAWNED ITEM</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Item Description: _________________________________________________________________________________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">V. RENEWAL DETAILS</h2>
      <table className="w-full border-collapse border border-black text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">DESCRIPTION</th>
            <th className="border border-black p-2 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">Original Loan Amount</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr>
            <td className="border border-black p-2">Interest Paid</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr>
            <td className="border border-black p-2">Service Fee</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr>
            <td className="border border-black p-2">Other Charges</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr className="bg-yellow-200 font-bold">
            <td className="border border-black p-2">TOTAL AMOUNT PAID</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
        </tbody>
      </table>

      <h2 className="font-bold mb-4">VI. UPDATED LOAN PERIOD</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Original Pawn Date: _______________________</p>
        <p>Previous Maturity Date: ___________________</p>
        <p>New Maturity Date: ________________________</p>
        <p>New Expiry Date: __________________________</p>
      </div>

      <h2 className="font-bold mb-4">CUSTOMER ACKNOWLEDGEMENT</h2>
      <p className="text-sm mb-8">
        I acknowledge that I have paid the required amount for the renewal of my pawn loan. I understand that the loan has been extended based on the new maturity and expiry dates stated above.
      </p>

      <div className="mt-12 text-sm">
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
        </div>
      </div>

      <p className="mt-12 text-sm italic">
        This Renewal Slip serves as proof that your pawn loan has been successfully renewed. Please keep this slip together with your Pawn Ticket for future transactions.
      </p>

      <p className="mt-12 text-xs text-gray-500 text-right">Generated via QuickPawn Pawnshop Management System, 2026.</p>
    </div>
  );
};
