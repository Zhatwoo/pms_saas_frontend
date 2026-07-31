import React from 'react';

export const BuyBackSlipTemplate = () => {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-0">
      <div className="text-center mb-8">
        <p className="font-bold">LOGO</p>
        <p className="font-bold uppercase">PAWNSHOP NAME</p>
        <h1 className="text-2xl font-bold mt-4">BUY BACK SLIP</h1>
      </div>

      <div className="space-y-4 text-sm mb-8">
        <p><strong>Business Address:</strong> _______________________________________________</p>
        <p><strong>Contact Number:</strong> ________________________________________________</p>
        <p><strong>Email Address:</strong> _________________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">I. BUY BACK TRANSACTION</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Buy Back Slip No.: _______________________</p>
        <p>Date: ____________________________________</p>
        <p>Processed By: _____________________________</p>
      </div>

      <h2 className="font-bold mb-4">II. CUSTOMER INFORMATION</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Customer Name: ___________________________________________</p>
        <p>Address: ________________________________________________</p>
        <p>Contact Number: _________________________________________</p>
        <p>Government ID Presented: ________________________________</p>
        <p>ID Number: _____________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">III. ITEM INFORMATION</h2>
      <div className="space-y-3 text-sm mb-6">
        <p>Reference No. / Pawn Ticket No.: ___________________________</p>
        <p>Item Description: ________________________________________________________________________________________________________________</p>
        <p>Brand: _______________________</p>
        <p>Model: _______________________</p>
        <p>Serial Number: __________________</p>
        <p>Item Condition: _________________________________________________________________________________________________________________</p>
      </div>

      <h2 className="font-bold mb-4">V. BUY BACK DETAILS</h2>
      <table className="w-full border-collapse border border-black text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">DESCRIPTION</th>
            <th className="border border-black p-2 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">Buy Back Price</td>
            <td className="border border-black p-2 text-right"></td>
          </tr>
          <tr>
            <td className="border border-black p-2">Processing Fee (if any)</td>
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

      <h2 className="font-bold mb-4">CUSTOMER ACKNOWLEDGEMENT</h2>
      <p className="text-sm mb-6">
        I acknowledge that I have voluntarily purchased or bought back the item described above after paying the total amount due. I confirm that I have inspected the item and received it in satisfactory condition together with any listed accessories. Upon release of the item, I acknowledge that this transaction is considered complete, and the Pawnshop shall have no further obligation relating to the item unless otherwise provided by law or a separate written agreement.
      </p>

      <h2 className="font-bold mb-4">PAWNSHOP DECLARATION</h2>
      <p className="text-sm mb-8">
        The Pawnshop certifies that the above-described item has been released to the Customer upon full payment of the Buy Back amount and completion of the required verification procedures.
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
