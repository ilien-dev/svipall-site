# Contributing

Thanks for wanting to help with the site. A few rules keep it manageable.

## The docs are not edited here

Everything under `/docs` is built from `docs/` and `CHANGELOG.md` in
[ilien-dev/svipall](https://github.com/ilien-dev/svipall). A fix to a docs page
goes to that repository. A pull request here that changes generated docs will be
closed.

## Open an issue first

Every change starts with an issue, including a typo or a broken link. Say what
is wrong and what you would change. For the product page, wait until the issue
is accepted before writing anything: its wording and layout are decided by the
maintainer.

## Pull requests

- Link the issue in the description (`Closes #12`).
- Run `npm run verify` before you push.
- Every pull request needs the code owner's approval before it can be merged.

A pull request without an issue is closed without review.
