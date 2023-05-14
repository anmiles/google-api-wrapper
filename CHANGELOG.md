# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [9.0.0](../../tags/v9.0.0) - 2023-05-15
### Changed
- Update `@anmiles/logger` with breaking change (removing timestamps for colored logs)

## [8.0.2](../../tags/v8.0.2) - 2023-05-08
### Changed
- Use shared eslint config * update ignorePatterns

## [8.0.1](../../tags/v8.0.1) - 2023-05-08
### Changed
- Updated `@anmiles/prototypes`

## [8.0.0](../../tags/v8.0.0) - 2023-05-08
### Changed
- Use `@anmiles/prototypes` instead of old built-in fs functions

## [7.0.7](../../tags/v7.0.7) - 2023-05-07
### Changed
- Move repository
- Use shared eslint config
- Use `@anmiles/logger` instead of old built-in logger
- Cleanup cSpell words

## [7.0.6](../../tags/v7.0.6) - 2023-05-02
### Changed
- Display scopes on instructions page

## [7.0.4](../../tags/v7.0.4) - 2023-04-22
### Changed
- Always require refresh token for permanent credentials

## [7.0.2](../../tags/v7.0.2) - 2023-04-22
### Changed
- Show instructions in the browser to prevent direct opening profile-oriented pages in wrong browsers

## [7.0.1](../../tags/v7.0.1) - 2023-04-22
### Changed
- Compatibility for `open` package

## [7.0.0](../../tags/v7.0.0) - 2023-04-22
### Changed
- Invalidate tokens after 7 days due to Google policy for testing apps

## [6.1.1](../../tags/v6.1.1) - 2023-03-27
### Changed
- Immediately destroy server after receiving needed response

## [6.1.0](../../tags/v6.1.0) - 2023-03-24
### Added
- Overriding scopes for `getAuth` and `getAPI` functions

## [6.0.1](../../tags/v6.0.1) - 2023-03-20
### Changed
- Improved types for `getItems` method

## [6.0.0](../../tags/v6.0.0) - 2023-03-20
### Added
- Non-persistence mode for getAuth: ability to not save sensitive credentials into the file
- `hideProgress` option for `login` that is false by default

### Changed
- `showProgress` changed to `hideProgress` and it's false by default
- `persist` changed to `temporary` and it's false by default

## Removed
- Removed getter methods from api helpers to be able to re-use auth between api usages. Now better call `getAPI` and then run needed native methods on their own.

## [4.0.0](../../tags/v4.0.0) - 2023-03-12
### Changed
- Silent mode for getting items

## [3.0.3](../../tags/v3.0.3) - 2023-03-12
### Changed
- Fixed path to scopes file

## [3.0.0](../../tags/v3.0.0) - 2023-03-13
### Changed
- Revised auth instructions
- Scopes can be set per end-project

## [2.1.3](../../tags/v2.1.3) - 2023-03-13
### Changed
- Fixed exported types

## [2.1.0](../../tags/v2.1.0) - 2023-03-13
### Added
- Calendars list API
- Export shared `getItems` to use for any other APIs

## [2.0.1](../../tags/v2.0.1) - 2023-03-12
### Changed
- Fixed exported types

## [2.0.0](../../tags/v2.0.0) - 2023-03-12
### Changed
- Split APIs

## [1.0.0](../../tags/v1.0.0) - 2023-03-12
### Changed
- First release

## 0.0.1 - 2023-03-12
### Added
- Initial commit
