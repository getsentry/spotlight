import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Attachment from "./Attachment";

// Mock SVG imports
vi.mock("@spotlight/ui/assets/download.svg", () => ({
  ReactComponent: () => null,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
});

describe("Attachment", () => {
  describe("download URL generation", () => {
    it("should create download URL for text/plain attachments", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "text/plain", filename: "test.txt" }}
          attachment="Hello, World!"
          expanded={true}
        />,
      );

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("text/plain");
    });

    it("should create download URL for text/csv attachments", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "text/csv", filename: "data.csv" }}
          attachment="name,value\nfoo,bar"
          expanded={true}
        />,
      );

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("text/csv");
    });

    it("should create download URL for application/json attachments", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "application/json", filename: "config.json" }}
          attachment='{"key": "value"}'
          expanded={true}
        />,
      );

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("application/json");
    });

    it("should create download URL for text/javascript attachments", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "text/javascript", filename: "script.js" }}
          attachment="console.log('hello');"
          expanded={true}
        />,
      );

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("text/javascript");
    });

    it("should create download URL for image/png attachments with base64 data", () => {
      // Valid base64 for a tiny 1x1 PNG
      const base64Png =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      render(
        <Attachment
          header={{ type: "attachment", content_type: "image/png", filename: "screenshot.png" }}
          attachment={base64Png}
          expanded={true}
        />,
      );

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob.type).toBe("image/png");
    });

    it("should not create download URL when not expanded", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "text/plain", filename: "test.txt" }}
          attachment="Hello, World!"
          expanded={false}
        />,
      );

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("download link", () => {
    it("should render download link with correct filename", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "text/plain", filename: "my-file.txt" }}
          attachment="content"
          expanded={true}
        />,
      );

      const link = screen.getByRole("link");
      expect(link.getAttribute("download")).toBe("my-file.txt");
      expect(link.getAttribute("href")).toBe("blob:mock-url");
    });

    it("should use inferred filename when not provided", () => {
      render(
        <Attachment
          header={{ type: "attachment", content_type: "application/json" }}
          attachment='{"key": "value"}'
          expanded={true}
        />,
      );

      const link = screen.getByRole("link");
      expect(link.getAttribute("download")).toBe("untitled.json");
    });
  });

  describe("error handling", () => {
    it("should show error message for invalid base64 image data", () => {
      const { container } = render(
        <Attachment
          header={{ type: "attachment", content_type: "image/png", filename: "bad.png" }}
          attachment="this is not valid base64!!!"
          expanded={true}
        />,
      );

      expect(container.textContent).toContain("Failed to decode attachment data");
    });
  });

  describe("content preview", () => {
    it("should render text content for text/plain", () => {
      const { container } = render(
        <Attachment
          header={{ type: "attachment", content_type: "text/plain", filename: "test.txt" }}
          attachment="Hello, World!"
          expanded={true}
        />,
      );

      expect(container.textContent).toContain("Hello, World!");
    });

    it("should render JSON viewer for application/json", () => {
      const { container } = render(
        <Attachment
          header={{ type: "attachment", content_type: "application/json", filename: "data.json" }}
          attachment='{"name": "test"}'
          expanded={true}
        />,
      );

      // JSON viewer should parse and display the content
      expect(container.textContent).toContain("name");
    });

    it("should show parse error for invalid JSON", () => {
      const { container } = render(
        <Attachment
          header={{ type: "attachment", content_type: "application/json", filename: "bad.json" }}
          attachment="not valid json"
          expanded={true}
        />,
      );

      expect(container.textContent).toContain("Failed to parse JSON attachment");
    });

    it("should show expand prompt when not expanded", () => {
      const { container } = render(
        <Attachment
          header={{ type: "attachment", content_type: "text/plain", filename: "test.txt" }}
          attachment="Hello"
          expanded={false}
        />,
      );

      expect(container.textContent).toContain("Expand to preview attachment");
    });
  });

  describe("cleanup", () => {
    it("should revoke blob URL on unmount", () => {
      const { unmount } = render(
        <Attachment
          header={{ type: "attachment", content_type: "text/plain", filename: "test.txt" }}
          attachment="content"
          expanded={true}
        />,
      );

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);

      unmount();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });
});
