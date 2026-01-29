# ink-api Development Guide

## Code Completion Guidelines
- Never use hardcoded data when fulfilling prompts. We will get data from the API and generate test data in the API.

## Code Style Guidelines
- **Framework**: NextJs, ReactNative
- **Namespacing**: PSR-4 with App\\ namespace
- **Folder Structure**: Follow React and NextJs best practices
- **Error Handling**: Use exceptions and proper try/catch blocks
- **Testing**: Playwright
- **Documentation**: DocBlocks on classes and complex methods
- **Git Flow**: Don't automatically perform any git operations; I'll handle git and version control

## Testing Guidelines
- All tests should follow Laravel testing conventions
- Mocking should be reserved for complex situations
- Laravel models should be used directly in tests whenever possible
- All test methods should be prefixed with "test"; this is required in the latest version of PHPUnit

All code changes must pass CI tests and receive an approval before merging to develop.

Never ever run NPM commands. I will rebuild my own project.
Always check the /ink-api/docs directory to understand the flow and update it when we make changes to a process. 
Always use the colors.ts for our styles. 
Always reuse components where possible.
Always plan designs with mobile views in mind.