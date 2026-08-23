import { fireEvent, render, screen } from "@testing-library/react";
import { TransactionPasswordField } from "../transaction-password-field";

describe("TransactionPasswordField", () => {
  it("toggles password visibility with the Show/Hide button", () => {
    const onChange = jest.fn();

    render(
      <TransactionPasswordField
        label="Security Password"
        value="secret123"
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText("••••••••");
    expect(input.getAttribute("type")).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.getAttribute("type")).toBe("password");
  });

  it("forwards input changes to onChange", () => {
    const onChange = jest.fn();

    render(<TransactionPasswordField value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pawn1234" },
    });

    expect(onChange).toHaveBeenCalledWith("pawn1234");
  });
});
