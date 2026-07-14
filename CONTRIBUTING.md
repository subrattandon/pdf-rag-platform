# Contributing to PDF Sage

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repository
2. Follow the [Quick Start](README.md#quick-start) instructions in the README
3. Create a feature branch: `git checkout -b feature/your-feature`

## Development Workflow

### Backend (Python)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Run linting and type checks:

```bash
ruff check .
ruff format .
```

### Frontend (TypeScript)

```bash
cd frontend
npm run dev
```

Run linting:

```bash
npm run lint
```

## Code Style

### Python

- Follow PEP 8 conventions
- Use type hints for function signatures
- Keep functions focused and concise
- Use `ruff` for linting and formatting

### TypeScript/React

- Use functional components with hooks
- Follow existing component patterns in `frontend/components/ui/`
- Use Tailwind CSS for styling (no inline styles)
- Keep components focused and reusable

## Pull Request Process

1. Create a focused PR — one feature or fix per PR
2. Write a clear description of what changed and why
3. Make sure `npm run lint` and `ruff check .` pass
4. Test your changes manually in the browser
5. Request a review

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Mention your browser/OS for frontend issues

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
