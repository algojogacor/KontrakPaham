# KontrakPaham

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

KontrakPaham is a web application that helps you read contracts like an expert in just 60 seconds. Upload your contract (PDF, DOCX, or text) in Indonesian, and our AI will detect problematic clauses, explain the risks in layman's terms, and provide actionable advice before you sign.

## Features

*   **Contract Analysis:** AI-powered detection of risky clauses.
*   **Plain Language Explanations:** Understand complex legal jargon.
*   **Actionable Advice:** Get suggestions on what to do before signing.
*   **Support for Multiple Formats:** Upload PDFs, Word documents (DOCX), or plain text.
*   **Indonesian Language Support:** Specifically designed for Indonesian contracts.

## Tech Stack

*   **Framework:** Next.js (React)
*   **Styling:** Tailwind CSS, Shadcn UI
*   **Language:** TypeScript
*   **Database:** Prisma (with libSQL)
*   **Authentication:** NextAuth.js
*   **AI SDK:** z-ai-web-dev-sdk

## Getting Started

### Prerequisites

*   [Bun](https://bun.sh/) (or Node.js/npm)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/kontrakpaham.git
    cd kontrakpaham
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Set up environment variables:
    *   Copy the example environment file (if available) or create a `.env` file.
    *   Configure your database URL and other required variables (like NextAuth secret, AI API keys).

4.  Set up the database:
    ```bash
    bun run db:push
    bun run db:generate
    ```

5.  Run the development server:
    ```bash
    bun run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
