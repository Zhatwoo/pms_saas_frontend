import { fireEvent, render, screen } from "@testing-library/react";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
  it("renders an interactive card as a button and invokes its handler", () => {
    const onClick = jest.fn();

    render(<StatCard label="Active contracts" value={12} onClick={onClick} />);

    const card = screen.getByRole("button", { name: /active contracts/i });
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
