# Penny Profiles

Generates synthetic banking personas for testing payment, onboarding/KYC and sanctions-screening systems. Each persona has a name, date of birth, local-format address, phone, email and national ID. It also gets a bank account whose domestic and international identifiers pass the real validation algorithms.

```sh
npm install
npm run dev      # app at http://localhost:5173
npm test         # algorithm vectors + 250 generated personas per country
npm run build
```

Or with Docker. The image runs the tests, builds the site and serves it with nginx:

```sh
docker compose up -d --build              # http://localhost:8088
PORT=9000 docker compose up -d --build    # choose another host port
```

Every persona comes from a 32-bit seed. Enter the seed again, or open `#GB-12345` in the URL, to get the same persona back. Batch export writes CSV (with a BOM so Excel shows non-Latin scripts correctly) or JSON.

## Coverage

| Country | Domestic | International | National ID |
|---|---|---|---|
| 🇬🇧 UK | Sort code + account, **Vocalink modulus checked** | IBAN, BIC | NI number |
| 🇩🇪 Germany | BLZ + Kontonummer (Bundesbank method 63) | IBAN, BIC | Steuer-ID |
| 🇫🇷 France | RIB with clé RIB | IBAN, BIC | NIR |
| 🇪🇸 Spain | CCC with control digits | IBAN, BIC | DNI |
| 🇮🇹 Italy | ABI/CAB/conto + CIN | IBAN, BIC | Codice fiscale (derived from name/DOB/birthplace) |
| 🇳🇱 Netherlands | Rekeningnummer (elfproef where applicable) | IBAN, BIC | BSN |
| 🇮🇪 Ireland | NSC + account | IBAN, BIC | PPSN |
| 🇧🇪 Belgium | Account with mod-97 check | IBAN, BIC | Rijksregisternummer |
| 🇦🇹 Austria | BLZ + Kontonummer | IBAN, BIC | SVNR |
| 🇵🇹 Portugal | NIB with check digits | IBAN, BIC | NIF |
| 🇫🇮 Finland | Tilinumero (Luhn) | IBAN, BIC | HETU |
| 🇦🇺 Australia | BSB (bank + state digit) + account | SWIFT + BSB/account | TFN |
| 🇳🇿 New Zealand | BB-bbbb-AAAAAAA-SS (Payments NZ algorithm A) | SWIFT + account | IRD |
| 🇨🇳 China | UnionPay card/account (Luhn), CNAPS, branch | SWIFT + pinyin name | Resident ID |
| 🇯🇵 Japan | Zengin bank/branch/type/account, katakana holder | SWIFT + branch/account | My Number |
| 🇮🇳 India | Account, IFSC, MICR, UPI ID | SWIFT + account/IFSC | PAN, Aadhaar (Verhoeff) |
| 🇷🇺 Russia | 20-digit account keyed to BIK, corr. account | SWIFT, IBAN (registry format) | INN, SNILS |
| 🇮🇷 Iran | Account, Shetab card (Luhn), Sheba | IBAN (Sheba), SWIFT | National code |
| 🇺🇸 USA | ABA routing + account | SWIFT + account | SSN |
| 🇲🇽 Mexico | CLABE with check digit | SWIFT + CLABE | CURP, RFC |
| 🇧🇷 Brazil | Agência + conta with bank DV | IBAN, SWIFT, ISPB | CPF, Pix key |

China, Japan, Russia and Iran also show names and addresses in the native script. The **Latin script only** toggle replaces every non-Latin detail with its Latin form. Those forms come from the generators themselves (pinyin, Hepburn romaji, the Russian/Persian Latin names), not from generic transliteration, which would read Japanese kanji as Chinese. The toggle applies to the view, Copy JSON and batch exports (`latinise()` in `src/core/latin.ts`). Russian names include a patronymic, Spanish/Mexican/Portuguese/Brazilian names have two surnames, and CN/JP names are written family name first.

## ISO 20022 structured addresses

Every address also comes as a fully structured ISO 20022 `PostalAddress24` (the version used by pacs.008.001.08 under CBPR+ and by SEPA), with no `AdrLine` elements. CBPR+ stops accepting fully unstructured addresses in November 2026. The UI lists each element and has a **Copy XML** button that produces a `<PstlAdr>` block. JSON exports include it as `address.structured`, and CSV exports have one `PstlAdr.<Tag>` column for each element.

- `TwnNm` and `Ctry` (ISO 3166 alpha-2) are always present. Elements appear in schema order, and lengths follow the XSD limits; a value that's too long throws an error instead of being truncated.
- Values use the CBPR+ restricted Latin character set, so diacritics are removed (`München` → `Munchen`, `ß` → `ss`). Native-script addresses stay in the human-readable `address.native` field only.
- Mapping rules: flat/apartment/unit/door → `Room`; Spanish/Portuguese floor → `Flr`; Indian building name → `BldgNm`. Suburb, colonia, bairro, Indian locality and Japanese town (chō) → `TwnLctnNm`; Chinese district and Japanese ward (-ku) → `DstrctNm`; state/province/county/prefecture → `CtrySubDvsn`. Japanese addresses have no street, so chōme-banchi-gō goes in `BldgNb`.

## How "valid" is valid?

- **Checksums are real.** Each value marked with a ✓ in the UI passes that algorithm. `test/vectors.test.ts` checks every algorithm against published examples. `test/personas.test.ts` generates 250 personas per country and validates them. IBANs and BICs are validated by `ibantools`, and UK accounts by `uk-modulus-checking`, so neither is checked only by our own code.
- **Bank codes are real.** BICs, UK sort code ranges, BLZ, ABA routing numbers, CLABE bank codes, ISPB, BIK and similar codes belong to the real banks named. Only the account numbers are random.
- **UK modulus rules** come from Vocalink `valacdos` v900, limited to ranges that use the standard MOD10/MOD11/DBLAL methods. The current Pay.UK table could differ for some ranges. To refresh, update `src/countries/gb-modulus.ts`.
- **Partial checks.** Some values pass a structure check but have no checksum, either because the format has none (AU/US/JP/IN account numbers, PAN, SSN, AT accounts) or because the check isn't public (CNAPS). For Brazil, only Itaú, Bradesco and Banco do Brasil are generated, because their published DV rules are the ones implemented.
- **Collisions.** Because the numbers are valid, a generated account or ID could match a real one. Never send payments or make real-world lookups with this data.

## Safety by design

- Emails always use the IANA-reserved `example.com/.net/.org` domains.
- UK phones are in Ofcom's drama range (07700 900xxx). US phones use 555-01xx. Other countries' numbers are random and could be real.
- Russia and Iran personas carry notes about sanctions, so you can test screening flows.

## Layout

```
src/core/        RNG, checksum algorithms, IBAN, shared person helpers, types
src/countries/   one generator per country (eurozone countries share a builder)
src/main.ts      UI;  src/export.ts  CSV/JSON export
test/            algorithm vectors + per-country property tests
```

To add a country, implement `CountryModule` (see any file in `src/countries/`) and register it in `src/countries/index.ts`. The test suite then runs the generic BIC/IBAN/determinism tests on it automatically.
