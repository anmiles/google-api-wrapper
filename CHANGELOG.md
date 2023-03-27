# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
