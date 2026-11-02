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
| 🇬🇷 Greece | Bank/branch/account | IBAN, BIC | AFM, AMKA |
| 🇭🇷 Croatia | VBDI + account (ISO 7064 MOD 11,10) | IBAN, BIC | OIB |
| 🇱🇺 Luxembourg | Account | IBAN, BIC | Matricule (structure) |
| 🇪🇪 Estonia | Account (7-3-1 check) | IBAN, BIC | Isikukood |
| 🇸🇰 Slovakia | Account (mod 11) | IBAN, BIC | Rodné číslo |
| 🇨🇭 Switzerland | IID + account | IBAN, BIC | AHV/AVS (EAN-13) |
| 🇵🇱 Poland | NRB, sort code check | IBAN, BIC | PESEL |
| 🇳🇴 Norway | Kontonummer (mod 11) | IBAN, BIC | Fødselsnummer |
| 🇸🇪 Sweden | Clearing + account (Bankgirot rules), Swish | IBAN, BIC | Personnummer |
| 🇹🇷 Turkey | IBAN, branch, account | IBAN, BIC | T.C. Kimlik No |
| 🇺🇦 Ukraine | IBAN, MFO, account | IBAN, BIC | RNOKPP |
| 🇧🇾 Belarus | IBAN, balance account | IBAN, BIC | Personal number (structure) |
| 🇦🇺 Australia | BSB (bank + state digit) + account | SWIFT + BSB/account | TFN |
| 🇳🇿 New Zealand | BB-bbbb-AAAAAAA-SS (Payments NZ algorithm A) | SWIFT + account | IRD |
| 🇨🇳 China | UnionPay card/account (Luhn), CNAPS, branch | SWIFT + pinyin name | Resident ID |
| 🇯🇵 Japan | Zengin bank/branch/type/account, katakana holder | SWIFT + branch/account | My Number |
| 🇮🇳 India | Account, IFSC, MICR, UPI ID | SWIFT + account/IFSC | PAN, Aadhaar (Verhoeff) |
| 🇦🇪 UAE | IBAN, account | IBAN, BIC | Emirates ID (Luhn) |
| 🇸🇦 Saudi Arabia | IBAN, account | IBAN, BIC | National ID (structure), Hijri date of birth |
| 🇮🇱 Israel | Bank/branch/account | IBAN, BIC | Teudat Zehut |
| 🇳🇬 Nigeria | NUBAN (CBN check digit) | SWIFT + NUBAN | BVN, NIN (structure) |
| 🇷🇺 Russia | 20-digit account keyed to BIK, corr. account | SWIFT, IBAN (registry format) | INN, SNILS |
| 🇮🇷 Iran | Account, Shetab card (Luhn), Sheba | IBAN (Sheba), SWIFT | National code |
| 🇰🇷 South Korea | Bank code + account | SWIFT + account | Resident registration number |
| 🇵🇰 Pakistan | IBAN, account, Raast ID | IBAN, BIC | CNIC (structure) |
| 🇵🇭 Philippines | Account, GCash/InstaPay | SWIFT + account | TIN |
| 🇺🇸 USA | ABA routing + account | SWIFT + account | SSN |
| 🇲🇽 Mexico | CLABE with check digit | SWIFT + CLABE | CURP, RFC |
| 🇧🇷 Brazil | Agência + conta with bank DV (unverified) | IBAN, SWIFT, ISPB | CPF, Pix key |
| 🇨🇦 Canada | Transit + institution + account, EFT routing | SWIFT + account | SIN |
| 🇻🇪 Venezuela | 20-digit account, Pago Móvil | SWIFT + account | Cédula, RIF |

China, Japan, South Korea, Russia, Ukraine, Belarus, Greece, Israel, Iran, Saudi Arabia and the UAE (for Emirati personas) also show names and addresses in native script. UAE personas reflect its mostly expatriate population (Emirati, Indian, Pakistani, Filipino, British). The **Latin script only** toggle replaces every non-Latin detail with its Latin form. Those forms come from the generators themselves (pinyin, Hepburn romaji, the Russian/Persian Latin names), not from generic transliteration, which would read Japanese kanji as Chinese. The toggle applies to the view, Copy JSON and batch exports (`latinise()` in `src/core/latin.ts`). Russian names include a patronymic, Spanish/Mexican/Portuguese/Brazilian names have two surnames, and CN/JP names are written family name first.

## ISO 20022 structured addresses

Every address also comes as a fully structured ISO 20022 `PostalAddress24` (the version used by pacs.008.001.08 under CBPR+ and by SEPA), with no `AdrLine` elements. CBPR+ stops accepting fully unstructured addresses in November 2026. The UI lists each element and has a **Copy XML** button that produces a `<PstlAdr>` block. JSON exports include it as `address.structured`, and CSV exports have one `PstlAdr.<Tag>` column for each element.

- `TwnNm` and `Ctry` (ISO 3166 alpha-2) are always present. Elements appear in schema order, and lengths follow the XSD limits; a value that's too long throws an error instead of being truncated.
- Values use the CBPR+ restricted Latin character set, so diacritics are removed (`München` → `Munchen`, `ß` → `ss`). Native-script addresses stay in the human-readable `address.native` field only.
- Mapping rules: flat/apartment/unit/door → `Room`; Spanish/Portuguese floor → `Flr`; Indian building name → `BldgNm`. Suburb, colonia, bairro, Indian locality and Japanese town (chō) → `TwnLctnNm`; Chinese district and Japanese ward (-ku) → `DstrctNm`; state/province/county/prefecture → `CtrySubDvsn`. Japanese addresses have no street, so chōme-banchi-gō goes in `BldgNb`.

## How "valid" is valid?

- **Checksums are real.** Each value marked with a ✓ in the UI passes that algorithm. `test/vectors.test.ts` checks every algorithm against published examples. `test/personas.test.ts` generates 250 personas per country and validates them. IBANs and BICs are validated by `ibantools`, and UK accounts by `uk-modulus-checking`, so neither is checked only by our own code.
- **Bank codes are real.** BICs, UK sort code ranges, BLZ, ABA routing numbers, CLABE bank codes, ISPB, BIK and similar codes belong to the real banks named. Only the account numbers are random.
- **UK modulus rules** come from Vocalink `valacdos` v900, limited to ranges that use the standard MOD10/MOD11/DBLAL methods. The current Pay.UK table could differ for some ranges. To refresh, update `src/countries/gb-modulus.ts`.
- **Partial checks.** Some values pass a structure check but have no checksum, either because the format has none (AU/US/JP/IN account numbers, PAN, SSN, AT accounts) or because the check isn't public (CNAPS). Brazilian branch/account check digits (DV) are generated with each bank's commonly documented rule, but no official specification exists, so they aren't marked as checked.
- **Collisions.** Because the numbers are valid, a generated account or ID could match a real one. Never send payments or make real-world lookups with this data.

## Validation rules and sources

Every ✓ in the app links back to a rule in this table. **Source** is where the rule is defined or documented. Where a national authority publishes it, that's linked; otherwise the reference is the [python-stdnum](https://arthurdejong.org/python-stdnum/) documentation, which describes each format and cites its own official sources. **Independent check** says how generated values are verified by something other than this project's code: the `ibantools` and `uk-modulus-checking` npm packages run in `npm test`, and python-stdnum was used to cross-check 400 generated personas per country during development. All links were checked on 2 November 2026.

### Shared algorithms

| Rule | Used for | Source |
|---|---|---|
| ISO 13616 IBAN (mod 97-10) | Every IBAN | [Wikipedia: IBAN](https://en.wikipedia.org/wiki/International_Bank_Account_Number), [ibantools](https://github.com/Simplify/ibantools) (also checks BBAN length/format) |
| Luhn (mod 10) | Card numbers, SIN, personnummer, AMKA, Finnish accounts | [Wikipedia: Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) |
| Verhoeff | Aadhaar | [Wikipedia: Verhoeff algorithm](https://en.wikipedia.org/wiki/Verhoeff_algorithm) |
| ISO 7064 MOD 11,10 | Steuer-ID, OIB, Croatian accounts | [Wikipedia: ISO/IEC 7064](https://en.wikipedia.org/wiki/ISO/IEC_7064) |
| EAN-13 check digit | Swiss AHV number | [Wikipedia: International Article Number](https://en.wikipedia.org/wiki/International_Article_Number) |
| Umm al-Qura calendar | Saudi Hijri date of birth | ICU / `Intl.DateTimeFormat` with `islamic-umalqura` |
| ISO 20022 PostalAddress24 | Structured addresses | [ISO 20022 message definitions](https://www.iso20022.org/) (field names and lengths from the pacs.008.001.08 schema) |

### Bank account identifiers

| Country | Rule | Source | Independent check |
|---|---|---|---|
| GB | Sort code + account modulus (MOD10, MOD11, DBLAL) | [Vocalink modulus checking](https://www.vocalink.com/tools/modulus-checking/) (spec v9.00, `valacdos` table) | [uk-modulus-checking](https://github.com/uphold/uk-modulus-checking) |
| DE | Bundesbank check method 63 (Deutsche Bank) | [Deutsche Bundesbank: Prüfzifferberechnung](https://www.bundesbank.de/de/aufgaben/unbarer-zahlungsverkehr/serviceangebot/pruefzifferberechnung) | Published example `0123456600` |
| FR | Clé RIB | [Wikipedia (fr): Relevé d'identité bancaire](https://fr.wikipedia.org/wiki/Relev%C3%A9_d%27identit%C3%A9_bancaire) | ibantools |
| ES | CCC control digits | [python-stdnum `es.ccc`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.es.ccc) | ibantools |
| IT | CIN | [Wikipedia (it): Coordinate bancarie](https://it.wikipedia.org/wiki/Coordinate_bancarie) | Published example IBAN `IT60 X054 2811 1010 0000 0123 456` |
| NL | Legacy elfproef (Rabobank/ABN AMRO) | [Wikipedia (nl): Elfproef](https://nl.wikipedia.org/wiki/Elfproef) | |
| BE | Account mod 97 | [python-stdnum `be.iban`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.be.iban) | ibantools |
| PT | NIB check digits | [Wikipedia (pt): NIB](https://pt.wikipedia.org/wiki/N%C3%BAmero_de_Identifica%C3%A7%C3%A3o_Banc%C3%A1ria) | ibantools |
| FI | Account Luhn | [Wikipedia: Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) | Published example `123456-00000785` |
| HR | VBDI and account (MOD 11,10) | [python-stdnum `hr.oib`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.hr.oib) (same algorithm) | ibantools; real VBDI codes carry valid check digits |
| EE | Account 7-3-1 check | [ibantools](https://github.com/Simplify/ibantools) `checkEstonianBBAN` | ibantools |
| SK | Account mod 11 (weights 6,3,7,9,10,5,8,4,2,1) | [ibantools](https://github.com/Simplify/ibantools) `checkCzechAndSlovakBBAN` | ibantools; example IBAN `SK31 1200 0000 1987 4263 7541` |
| PL | NRB and bank sort code check (3-9-7-1) | [ibantools](https://github.com/Simplify/ibantools) `checkPolandBBAN` | ibantools |
| NO | Account mod 11 | [python-stdnum `no.kontonr`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.no.kontonr) | ibantools, python-stdnum |
| SE | Bankgirot type 1 (SEB, Swedbank) and type 2 (Handelsbanken) | [Bankgirot: Bankernas kontonummeruppbyggnad](https://www.bankgirot.se/globalassets/dokument/anvandarmanualer/bankernaskontonummeruppbyggnad_anvandarmanual_sv.pdf) | Bankgirot example IBAN `SE45 5000 0000 0583 9825 7466` |
| AU | BSB structure (bank prefix + state digit) | [Wikipedia: Bank state branch](https://en.wikipedia.org/wiki/Bank_state_branch) | |
| NZ | Bank account algorithm A | [python-stdnum `nz.bankaccount`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.nz.bankaccount) | Published example `01-0902-0068389-00` |
| CN, IR | Card number Luhn | [Wikipedia: Payment card number](https://en.wikipedia.org/wiki/Payment_card_number) | |
| IN | IFSC structure | [Wikipedia: IFSC](https://en.wikipedia.org/wiki/Indian_Financial_System_Code) | |
| RU | Account and correspondent-account key (BIK + 7-1-3 weights) | Bank of Russia rule; no official text found online | The published correspondent accounts of Sberbank, VTB, Alfa-Bank and T-Bank all pass |
| US | ABA routing number (3-7-1) | [python-stdnum `us.rtn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.us.rtn) | Real routing numbers of the four banks used pass |
| NG | NUBAN check digit (3-7-3 weights with bank code) | [CBN: NUBAN proposals](https://www.cbn.gov.ng/OUT/2011/CIRCULARS/BSPD/NUBAN%20PROPOSALS%20V%200%204-%2003%2009%202010.PDF) | CBN worked examples `0000014579`, `0000000220` |
| TR, UA, BY, AE, SA, PK, IL, GR | IBAN only (no national account check) | ISO 13616 (above) | ibantools, python-stdnum |
| MX | CLABE check digit (3-7-1) | [Wikipedia: CLABE](https://en.wikipedia.org/wiki/CLABE) | Published example `002010077777777771` |

### National IDs

| Country | ID | Source |
|---|---|---|
| GB | National Insurance number (prefix rules) | [HMRC NIM39110](https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim39110) |
| DE | Steuer-ID | [python-stdnum `de.idnr`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.de.idnr) |
| FR | NIR | [python-stdnum `fr.nir`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.fr.nir) |
| ES | DNI | [python-stdnum `es.dni`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.es.dni) |
| IT | Codice fiscale | [python-stdnum `it.codicefiscale`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.it.codicefiscale) |
| NL | BSN | [python-stdnum `nl.bsn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.nl.bsn) |
| IE | PPSN | [python-stdnum `ie.pps`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ie.pps) |
| BE | Rijksregisternummer | [python-stdnum `be.nn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.be.nn) |
| AT | Sozialversicherungsnummer | [python-stdnum `at.vnr`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.at.vnr) |
| PT | NIF | [python-stdnum `pt.nif`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.pt.nif) |
| FI | HETU | [python-stdnum `fi.hetu`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.fi.hetu) |
| HR | OIB | [python-stdnum `hr.oib`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.hr.oib) |
| EE | Isikukood | [python-stdnum `ee.ik`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ee.ik) |
| SK | Rodné číslo | [python-stdnum `sk.rc`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.sk.rc) |
| LU | Matricule | No official specification of the check digits, so it isn't marked as checked |
| CH | AHV/AVS number | [python-stdnum `ch.ssn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ch.ssn) |
| PL | PESEL | [python-stdnum `pl.pesel`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.pl.pesel) |
| NO | Fødselsnummer | [python-stdnum `no.fodselsnummer`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.no.fodselsnummer) |
| SE | Personnummer | [python-stdnum `se.personnummer`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.se.personnummer) |
| TR | T.C. Kimlik No | [python-stdnum `tr.tckimlik`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.tr.tckimlik) |
| AU | TFN | [python-stdnum `au.tfn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.au.tfn) |
| NZ | IRD number | [python-stdnum `nz.ird`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.nz.ird) |
| CN | Resident Identity Card | [python-stdnum `cn.ric`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.cn.ric) |
| JP | My Number | [python-stdnum `jp.in_`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.jp.in_) |
| IN | Aadhaar | [python-stdnum `in_.aadhaar`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.in_.aadhaar) |
| IN | PAN (structure) | [python-stdnum `in_.pan`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.in_.pan) |
| RU | INN | [python-stdnum `ru.inn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ru.inn) |
| RU | SNILS | [Wikipedia (ru): СНИЛС](https://ru.wikipedia.org/wiki/%D0%A1%D1%82%D1%80%D0%B0%D1%85%D0%BE%D0%B2%D0%BE%D0%B9_%D0%BD%D0%BE%D0%BC%D0%B5%D1%80_%D0%B8%D0%BD%D0%B4%D0%B8%D0%B2%D0%B8%D0%B4%D1%83%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D0%B3%D0%BE_%D0%BB%D0%B8%D1%86%D0%B5%D0%B2%D0%BE%D0%B3%D0%BE_%D1%81%D1%87%D1%91%D1%82%D0%B0) |
| IR | National code (mod 11) | No official specification found online; matches the rule used by open-source Iranian validators |
| US | SSN (structure) | [python-stdnum `us.ssn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.us.ssn) |
| MX | CURP | [python-stdnum `mx.curp`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.mx.curp) |
| MX | RFC | [python-stdnum `mx.rfc`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.mx.rfc) |
| BR | CPF | [python-stdnum `br.cpf`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.br.cpf) |
| CA | SIN | [python-stdnum `ca.sin`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ca.sin) |
| GR | AFM | [python-stdnum `gr.vat`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.gr.vat) |
| GR | AMKA | [python-stdnum `gr.amka`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.gr.amka) |
| UA | RNOKPP | [python-stdnum `ua.rntrc`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ua.rntrc) |
| BY | Personal number | Check digit not publicly documented, so it isn't marked as checked |
| IL | Teudat Zehut | [python-stdnum `il.idnr`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.il.idnr) |
| KR | Resident registration number | [python-stdnum `kr.rrn`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.kr.rrn) |
| AE | Emirates ID (Luhn) | [Microsoft Purview: UAE identity card number](https://learn.microsoft.com/en-us/purview/sit-defn-uae-identity-card-number) |
| SA | National ID | The Saudi Central Bank (SAMA) says the formula is released only on request, so it isn't marked as checked |
| PK | CNIC (province and sex digits) | [python-stdnum `pk.cnic`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.pk.cnic) |
| NG | BVN, NIN | No published check digit |
| VE | RIF | [python-stdnum `ve.rif`](https://arthurdejong.org/python-stdnum/doc/2.2/stdnum.ve.rif) |

### Reserved test values

| What | Source |
|---|---|
| UK drama phone numbers (07700 900xxx) | [Ofcom: numbers for drama](https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama) |
| North American fictional numbers (555-01xx) | [Wikipedia: 555 (telephone number)](https://en.wikipedia.org/wiki/555_(telephone_number)) |
| Email domains (`example.com/.net/.org`) | [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) |

## Safety by design

- Emails always use the IANA-reserved `example.com/.net/.org` domains.
- UK phones are in Ofcom's drama range (07700 900xxx). US phones use 555-01xx. Other countries' numbers are random and could be real.
- Russia, Iran, Belarus and Venezuela personas carry notes about sanctions (and Ukraine about occupied regions), so you can test screening flows.

## Layout

```
src/core/        RNG, checksum algorithms, IBAN, shared person helpers, types
src/countries/   one generator per country (one file each for newer countries; eurozone countries share a builder);
                 names.ts holds every name pool
src/main.ts      UI;  src/export.ts  CSV/JSON export
test/            algorithm vectors + per-country property tests
```

To add a country, implement `CountryModule` (see any file in `src/countries/`) and register it in `src/countries/index.ts`. The test suite then runs the generic BIC/IBAN/determinism tests on it automatically.
