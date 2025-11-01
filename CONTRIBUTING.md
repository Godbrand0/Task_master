# Contributing to TaskMaster

Thank you for your interest in contributing to TaskMaster! This guide provides information on how to contribute to the project, including coding standards, pull request process, and community guidelines.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Rust (for smart contract development)
- Soroban CLI (Stellar's smart contract platform)
- Stellar wallet (Freighter, Albedo, or XBull)

### Initial Setup

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment following the [Development Guide](DEVELOPMENT.md)
4. Create a new branch for your contribution

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- Clear description of the bug
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, browser, wallet, etc.)
- Screenshots if applicable

### Suggesting Features

For feature requests, please create an issue with:

- Clear description of the feature
- Use case and motivation
- Proposed implementation (if you have ideas)
- Potential challenges or considerations

### Contributing Code

1. Check the [Issues](https://github.com/your-username/TaskMaster/issues) page for open issues
2. Claim an issue by commenting on it
3. Create a new branch from `main` with a descriptive name
4. Implement your changes following our coding standards
5. Add tests for your changes
6. Update documentation as needed
7. Submit a pull request

## Development Process

### Branch Naming

Use descriptive branch names following these patterns:

- `feature/feature-name` for new features
- `bugfix/bug-description` for bug fixes
- `docs/documentation-update` for documentation changes
- `refactor/code-refactoring` for code refactoring

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(wallet): add support for XBull wallet
fix(task): resolve task completion bug
docs(readme): update installation instructions
```

## Coding Standards

### TypeScript/React

1. **Use TypeScript for all new code**
2. **Follow functional component patterns**
3. **Use hooks for state and side effects**
4. **Implement proper error boundaries**
5. **Add JSDoc comments for all public functions**
6. **Use CSS Modules for component styling**

#### Component Structure

```typescript
import React from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Define props here
}

/**
 * Brief description of the component
 * @param props - Component props
 */
export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // Component implementation
  
  return (
    <div className={styles.container}>
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

#### Hook Structure

```typescript
import { useState, useEffect } from 'react';

/**
 * Brief description of the hook
 * @param param - Hook parameters
 * @returns Hook return values
 */
export const useCustomHook = (param: string) => {
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    // Effect implementation
  }, [param]);
  
  return { state, setState };
};
```

### Rust (Smart Contract)

1. **Follow Rust naming conventions**
2. **Use `rustfmt` for code formatting**
3. **Implement comprehensive error handling**
4. **Add documentation comments for all public functions**
5. **Write unit tests for all functions**

#### Function Structure

```rust
/// Brief description of the function
/// 
/// # Arguments
/// 
/// * `param1` - Description of parameter 1
/// * `param2` - Description of parameter 2
/// 
/// # Returns
/// 
/// Description of return value
/// 
/// # Errors
/// 
/// Description of possible errors
pub fn function_name(param1: Type1, param2: Type2) -> Result<Type, Error> {
    // Function implementation
}
```

### CSS/Styling

1. **Use CSS Modules for component-specific styles**
2. **Follow BEM methodology for class names**
3. **Use CSS variables for consistent theming**
4. **Implement responsive design principles**
5. **Ensure accessibility standards**

#### CSS Module Example

```css
/* ComponentName.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button:hover {
  background-color: var(--primary-color-hover);
}
```

## Testing Guidelines

### Frontend Testing

1. **Write unit tests for all utility functions**
2. **Test React components with React Testing Library**
3. **Test custom hooks with appropriate testing utilities**
4. **Implement integration tests for user flows**
5. **Maintain test coverage above 80%**

#### Component Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    // ... other task properties
  };

  test('renders task information correctly', () => {
    render(<TaskCard task={mockTask} onComplete={jest.fn()} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('calls onComplete when complete button is clicked', () => {
    const mockOnComplete = jest.fn();
    render(<TaskCard task={mockTask} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('Complete Task'));
    expect(mockOnComplete).toHaveBeenCalledWith(1);
  });
});
```

### Smart Contract Testing

1. **Write unit tests for all contract functions**
2. **Test edge cases and error conditions**
3. **Test state transitions**
4. **Verify access control mechanisms**
5. **Test gas optimization**

#### Contract Testing Example

```rust
#[cfg(test)]
mod tests {
    use soroban_sdk::{Env, Address};
    use crate::{TaskMasterContract, TaskMasterContractClient};

    #[test]
    fn test_task_creation() {
        let env = Env::default();
        let contract_id = env.register_contract(None, TaskMasterContract);
        let client = TaskMasterContractClient::new(&env, &contract_id);
        
        // Test implementation
    }
}
```

## Documentation

### Code Documentation

1. **Add JSDoc comments for all public functions and components**
2. **Include parameter descriptions and return types**
3. **Document complex algorithms or business logic**
4. **Keep documentation up-to-date with code changes**

### README Updates

When contributing new features:

1. **Update the feature list in README.md**
2. **Add new environment variables if needed**
3. **Update installation or setup instructions**
4. **Add examples of new functionality**

### API Documentation

For API changes:

1. **Update API documentation**
2. **Include request/response examples**
3. **Document error responses**
4. **Add authentication requirements if applicable**

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
2. **Update documentation as needed**
3. **Follow coding standards**
4. **Check for any linting errors**
5. **Test your changes manually**

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Maintainer review**: All PRs require review from a project maintainer
2. **Automated checks**: CI/CD pipeline must pass
3. **Community feedback**: Encourage community review and discussion
4. **Approval**: At least one maintainer approval required for merge

### Merge Process

1. **Squash commits**: Maintain clean commit history
2. **Update version**: Update version number if needed
3. **Create release**: Create release notes for significant changes
4. **Deploy**: Deploy to appropriate environment

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Update version number**
2. **Update CHANGELOG.md**
3. **Create Git tag**
4. **Create GitHub release**
5. **Deploy to production**
6. **Update documentation**

## Community

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and discussions
- **Discord**: For real-time communication (link in README)

### Recognition

Contributors are recognized in:

- **README.md**: List of contributors
- **Release notes**: Attribution for specific contributions
- **Contributor statistics**: GitHub contributor insights

## Getting Help

If you need help with contributing:

1. **Check existing issues**: Your question might already be answered
2. **Create a discussion**: Ask questions in GitHub Discussions
3. **Join our Discord**: Get real-time help from the community
4. **Check documentation**: Review existing documentation

## Additional Resources

- [Stellar Development Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Rust Documentation](https://doc.rust-lang.org/)

Thank you for contributing to TaskMaster! Your contributions help make this project better for everyone.