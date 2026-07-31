import React from 'react';

export const RedemptionSlipTemplate = () => {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-0">
      <div className="text-center mb-8">
        <p className="font-bold">LOGO</p>
        <p className="font-bold uppercase">PAWNSHOP NAME</p>
        <h1 className="text-2xl font-bold mt-4">REDEMPTION SLIP</h1>
      </div>

      <div className="space-y-4 text-sm mb-6">
        <p><strong>Business Address:</strong> _______________________________________________</p>
        <p><strong>Contact Number:</strong> ________________________________________________</p>
        <p><strong>Email Address:</strong> _________________________________________________</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border border-black mb-6">
        <div className="p-4 border-b md:border-b-0 md:border-r border-black space-y-4">
          <h2 className="font-bold">I. REDEMPTION DETAILS</h2>
          <p>Redemption Slip No.: _______________________</p>
          <p>Pawn Ticket No.: ___________________________</p>
          <p>Date Redeemed: ____________________________</p>
          <p>Processed By: ______________________________</p>
        </div>
        <div className="p-4 space-y-4">
          <h2 className="font-bold">II. CUSTOMER INFORMATION</h2>
          <p>Customer Name: _____________________________________________</p>
          <p>Address: _________________________________________________</p>
          <p>Contact Number: ___________________________________________</p>
          <p>Government ID Presented: _________________________________</p>
          <p>ID Number: _______________________________________________</p>
        </div>
      </div>

      <h2 className="font-bold mb-4">III. PAWNED ITEM INFORMATION</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Item Description: ____________________________________________________________________________</p>
        <p>Brand: ________________________</p>
        <p>Model: ________________________</p>
        <p>Serial Number: __________________</p>
        <p>Accessories Returned: ________________________________________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">IV. PAYMENT DETAILS:</h2>
      <table className="w-full border-collapse border border-black text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">DETAILS</th>
            <th className="border border-black p-2 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">Principal Loan Amount</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr>
            <td className="border border-black p-2">Accrued Interest</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr>
            <td className="border border-black p-2">Service Charges</td>
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

      <div className="space-y-3 text-sm mb-8">
        <p><strong>Payment Method:</strong></p>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-1"><input type="checkbox" className="w-4 h-4" /> Cash</label>
          <label className="flex items-center gap-1"><input type="checkbox" className="w-4 h-4" /> Bank Transfer</label>
          <label className="flex items-center gap-1"><input type="checkbox" className="w-4 h-4" /> GCash</label>
          <label className="flex items-center gap-1"><input type="checkbox" className="w-4 h-4" /> Maya</label>
          <label className="flex items-center gap-1"><input type="checkbox" className="w-4 h-4" /> Others: _______________________</label>
        </div>
        <p className="mt-4"><strong>Official Receipt No.:</strong> _______________________</p>
      </div>

      <h2 className="font-bold mb-4">V. ACKNOWLEDGEMENT OF REDEMPTION</h2>
      <p className="text-sm mb-8">
        I hereby acknowledge that I have fully redeemed the pawned item described above after paying all applicable obligations. I confirm that I have received the item in satisfactory condition together with its listed accessories, if any. Upon release of the item, this pawn transaction shall be considered fully settled and completed, subject to applicable laws and the policies of the Pawnshop.
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
          <div className="col-span-1 md:col-span-2 mt-4">
            <p className="font-bold mb-4">WITNESS:<br/><span className="font-normal">(Optional)</span></p>
            <p>NAME: _______________________</p>
            <p className="mt-4">SIGNATURE: _______________________</p>
            <p className="mt-4">DATE: _______________________</p>
          </div>
        </div>
      </div>

      <p className="mt-12 text-xs text-gray-500 text-right">Generated via QuickPawn Pawnshop Management System, 2026.</p>
    </div>
  );
};
