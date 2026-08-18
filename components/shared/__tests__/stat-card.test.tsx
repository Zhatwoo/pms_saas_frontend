import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
  it("renders an interactive card as a button and invokes its handler", () => {
    const onClick = jest.fn();

    render(<StatCard label="Active contracts" value={12} onClick={onClick} />);

    const card = screen.getByRole("button", { name: /active contracts/i });
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("marks a selected interactive card as pressed", () => {
    render(
      <StatCard label="Overdue" value={0} selected onClick={jest.fn()} />,
    );

    expect(screen.getByRole("button", { name: /overdue/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
