# Contributing to KontrakPaham

First off, thank you for considering contributing to KontrakPaham! It's people like you that make open source such a great community.

## Where to Start?

*   **Did you find a bug?** Ensure the bug was not already reported by searching on GitHub under Issues. If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.
*   **Did you write a patch that fixes a bug?** Open a new GitHub pull request with the patch. Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.
*   **Do you intend to add a new feature or change an existing one?** Suggest your change in an issue and start writing code.

## Setting up your environment

1.  Fork the repo and clone it locally.
2.  Install dependencies using `bun install`.
3.  Set up your environment variables based on `.env.example` (or create a `.env`).
4.  Run `bun run dev` to start the local development server.

## Code Conventions

*   Use `TypeScript`.
*   Format your code using the configured linter (`bun run lint`).
*   Follow the conventional commit messages format.

## Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.
