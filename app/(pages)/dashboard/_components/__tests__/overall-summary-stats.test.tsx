import { fireEvent, render, screen } from "@testing-library/react";
import { OverallSummaryStats } from "../overall-summary-stats";

describe("OverallSummaryStats", () => {
  it("invokes the selected summary card destination", () => {
    const onTotalContractsClick = jest.fn();
    const onActiveClick = jest.fn();
    const onRedeemedClick = jest.fn();
    const onSalesClick = jest.fn();

    render(
      <OverallSummaryStats
        data={{
          totalContracts: 10,
          active: 5,
          redeemed: 3,
          redeemedOverdue: 0,
          totalOverallSales: "₱ 100",
        }}
        onTotalContractsClick={onTotalContractsClick}
        onActiveClick={onActiveClick}
        onRedeemedClick={onRedeemedClick}
        onSalesClick={onSalesClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /total contracts/i }));
    fireEvent.click(screen.getByRole("button", { name: /^active/i }));
    fireEvent.click(screen.getByRole("button", { name: /redeemed/i }));
    fireEvent.keyDown(screen.getByRole("button", { name: /total overall sales/i }), {
      key: "Enter",
    });

    expect(onTotalContractsClick).toHaveBeenCalledTimes(1);
    expect(onActiveClick).toHaveBeenCalledTimes(1);
    expect(onRedeemedClick).toHaveBeenCalledTimes(1);
    expect(onSalesClick).toHaveBeenCalledTimes(1);
  });
});
