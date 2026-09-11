---
uid: report-0acd182f
id: REPORT-3972
type: report
title: 'Scoped quality: fail (87 tests, 0 failed, 138 orphan AC(s))'
created_by: xgd
created_at: '2026-09-11T10:04:18.138340+00:00'
updated_at: '2026-09-11T10:04:18.138340+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: reconcile-BUNDLE-26
  commit: 4782269f6060182349a4585269e9a3e1236f8a4a
---

{
  "timestamp": "2026-09-11T10:02:42.943192Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0014565419405698776,
    "errors": 0,
    "warnings": 0,
    "error_list": [],
    "warning_list": []
  },
  "build": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0,
    "errors": 0,
    "error_list": [],
    "stdout": "No tsconfig.json \u2014 type-check skipped (JS-only project)",
    "stderr": ""
  },
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 1,
      "duration_seconds": 35.28944204095751,
      "passed": 87,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 87,
      "deselected": 810,
      "test_filter": [
        "test_UAT_AC1029",
        "test_UAT_AC1030",
        "test_UAT_AC1031",
        "test_UAT_AC1032",
        "test_UAT_AC1033",
        "test_UAT_AC1034",
        "test_UAT_AC1035",
        "test_UAT_AC1036",
        "test_UAT_AC1051",
        "test_UAT_AC1052",
        "test_UAT_AC1053",
        "test_UAT_AC1054",
        "test_UAT_AC1055",
        "test_UAT_AC1056",
        "test_UAT_AC1057",
        "test_UAT_AC1058",
        "test_UAT_AC1059",
        "test_UAT_AC1060",
        "test_UAT_AC1061",
        "test_UAT_AC1062",
        "test_UAT_AC1063",
        "test_UAT_AC1064",
        "test_UAT_AC1065",
        "test_UAT_AC1066",
        "test_UAT_AC1067",
        "test_UAT_AC1068",
        "test_UAT_AC1069",
        "test_UAT_AC1070",
        "test_UAT_AC1110",
        "test_UAT_AC1317",
        "test_UAT_AC1318",
        "test_UAT_AC1319",
        "test_UAT_AC1320",
        "test_UAT_AC1375",
        "test_UAT_AC1376",
        "test_UAT_AC1377",
        "test_UAT_AC1378",
        "test_UAT_AC1379",
        "test_UAT_AC1380",
        "test_UAT_AC1381",
        "test_UAT_AC1382",
        "test_UAT_AC1383",
        "test_UAT_AC1384",
        "test_UAT_AC1399",
        "test_UAT_AC1400",
        "test_UAT_AC1401",
        "test_UAT_AC1402",
        "test_UAT_AC1403",
        "test_UAT_AC1404",
        "test_UAT_AC1405",
        "test_UAT_AC1406",
        "test_UAT_AC1407",
        "test_UAT_AC1408",
        "test_UAT_AC1409",
        "test_UAT_AC1410",
        "test_UAT_AC1449",
        "test_UAT_AC1450",
        "test_UAT_AC1451",
        "test_UAT_AC1452",
        "test_UAT_AC1453",
        "test_UAT_AC1456",
        "test_UAT_AC1486",
        "test_UAT_AC1487",
        "test_UAT_AC1488",
        "test_UAT_AC1489",
        "test_UAT_AC1490",
        "test_UAT_AC1491",
        "test_UAT_AC1492",
        "test_UAT_AC1493",
        "test_UAT_AC1494",
        "test_UAT_AC1495",
        "test_UAT_AC1496",
        "test_UAT_AC1497",
        "test_UAT_AC1498",
        "test_UAT_AC1499",
        "test_UAT_AC1634",
        "test_UAT_AC1635",
        "test_UAT_AC1636",
        "test_UAT_AC1637",
        "test_UAT_AC1638",
        "test_UAT_AC1639",
        "test_UAT_AC1640",
        "test_UAT_AC1641",
        "test_UAT_AC1642",
        "test_UAT_AC1643",
        "test_UAT_AC1644",
        "test_UAT_AC1645",
        "test_UAT_AC1646",
        "test_UAT_AC1651",
        "test_UAT_AC1652",
        "test_UAT_AC1653",
        "test_UAT_AC1654",
        "test_UAT_AC1655",
        "test_UAT_AC1656",
        "test_UAT_AC1657",
        "test_UAT_AC1658",
        "test_UAT_AC1659",
        "test_UAT_AC1660",
        "test_UAT_AC1661",
        "test_UAT_AC1662",
        "test_UAT_AC1663",
        "test_UAT_AC1664",
        "test_UAT_AC1665",
        "test_UAT_AC1666",
        "test_UAT_AC1667",
        "test_UAT_AC1668",
        "test_UAT_AC1669",
        "test_UAT_AC1670",
        "test_UAT_AC1671",
        "test_UAT_AC1672",
        "test_UAT_AC1673",
        "test_UAT_AC1674",
        "test_UAT_AC1675",
        "test_UAT_AC1676",
        "test_UAT_AC1677",
        "test_UAT_AC1678",
        "test_UAT_AC1679",
        "test_UAT_AC1680",
        "test_UAT_AC1681",
        "test_UAT_AC1682",
        "test_UAT_AC1683",
        "test_UAT_AC1684",
        "test_UAT_AC1685",
        "test_UAT_AC1686",
        "test_UAT_AC1687",
        "test_UAT_AC1688",
        "test_UAT_AC1689",
        "test_UAT_AC1690",
        "test_UAT_AC1691",
        "test_UAT_AC1692",
        "test_UAT_AC1693",
        "test_UAT_AC1694",
        "test_UAT_AC1695",
        "test_UAT_AC1696",
        "test_UAT_AC1697",
        "test_UAT_AC1698",
        "test_UAT_AC1699",
        "test_UAT_AC1700",
        "test_UAT_AC1701",
        "test_UAT_AC1702",
        "test_UAT_AC1703",
        "test_UAT_AC1704",
        "test_UAT_AC1705",
        "test_UAT_AC1706",
        "test_UAT_AC1707",
        "test_UAT_AC1708",
        "test_UAT_AC1709",
        "test_UAT_AC1710",
        "test_UAT_AC1711",
        "test_UAT_AC1712",
        "test_UAT_AC1713",
        "test_UAT_AC1714",
        "test_UAT_AC1715",
        "test_UAT_AC1716",
        "test_UAT_AC1717",
        "test_UAT_AC1718",
        "test_UAT_AC1719",
        "test_UAT_AC1720",
        "test_UAT_AC1721",
        "test_UAT_AC1722",
        "test_UAT_AC1723",
        "test_UAT_AC1724",
        "test_UAT_AC1725",
        "test_UAT_AC1726",
        "test_UAT_AC1727",
        "test_UAT_AC1728",
        "test_UAT_AC1729",
        "test_UAT_AC1730",
        "test_UAT_AC1731",
        "test_UAT_AC1732",
        "test_UAT_AC1733",
        "test_UAT_AC1734",
        "test_UAT_AC1735",
        "test_UAT_AC1736",
        "test_UAT_AC1737",
        "test_UAT_AC1738",
        "test_UAT_AC1739",
        "test_UAT_AC1740",
        "test_UAT_AC1741",
        "test_UAT_AC1742",
        "test_UAT_AC1743",
        "test_UAT_AC1744",
        "test_UAT_AC1745",
        "test_UAT_AC1746",
        "test_UAT_AC1747",
        "test_UAT_AC1748",
        "test_UAT_AC1749",
        "test_UAT_AC1750",
        "test_UAT_AC1751",
        "test_UAT_AC1752",
        "test_UAT_AC1753",
        "test_UAT_AC1754",
        "test_UAT_AC1755",
        "test_UAT_AC1756",
        "test_UAT_AC1757",
        "test_UAT_AC1758",
        "test_UAT_AC1759",
        "test_UAT_AC1760",
        "test_UAT_AC1761",
        "test_UAT_AC959",
        "test_UAT_AC960",
        "test_UAT_AC961",
        "test_UAT_AC962",
        "test_UAT_AC963",
        "test_UAT_AC964",
        "test_UAT_AC965",
        "test_UAT_AC966",
        "test_UAT_AC967",
        "test_UAT_AC968",
        "test_UAT_AC969",
        "test_UAT_AC970",
        "test_UAT_AC971",
        "test_UAT_AC972",
        "test_UAT_AC973",
        "test_UAT_AC974",
        "test_UAT_AC975",
        "test_UAT_AC976",
        "test_UAT_AC977",
        "test_UAT_AC978",
        "test_UAT_AC979"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "st.ts\"},{\"assertionResults\":[],\"startTime\":1789120964479,\"endTime\":1789120964479,\"status\":\"failed\",\"message\":\"Transform failed with 1 error:\\n\\n\\u001b[31m[PARSE_ERROR] \\u001b[0mIdentifier `REMINDER_PROVIDER` has already been declared\\n     \\u001b[38;5;246m\u256d\\u001b[0m\\u001b[38;5;246m\u2500\\u001b[0m\\u001b[38;5;246m[\\u001b[0m tools/generate/src/cli/ai/host-core.ts:267:7 \\u001b[38;5;246m]\\u001b[0m\\n     \\u001b[38;5;246m\u2502\\u001b[0m\\n \\u001b[38;5;246m267 \u2502\\u001b[0m \\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249mo\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249ms\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249m \\u001b[0mREMINDER_PROVIDER\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m=\\u001b[0m\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mk\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m.\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mm\\u001b[0m\\u001b[38;5;249mi\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249md\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\n \\u001b[38;5;240m    \u2502\\u001b[0m       \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \\n \\u001b[38;5;240m    \u2502\\u001b[0m               \u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 `REMINDER_PROVIDER` has already been declared here\\n \\u001b[38;5;240m    \u2502\\u001b[0m \\n \\u001b[38;5;246m284 \u2502\\u001b[0m \\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249mo\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249ms\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249m \\u001b[0mREMINDER_PROVIDER\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m=\\u001b[0m\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mk\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m.\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mm\\u001b[0m\\u001b[38;5;249mi\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249md\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\n \\u001b[38;5;240m    \u2502\\u001b[0m       \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \\n \\u001b[38;5;240m    \u2502\\u001b[0m               \u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 It can not be redeclared here\\n\\u001b[38;5;246m\u2500\u2500\u2500\u2500\u2500\u256f\\u001b[0m\\n\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-26/tests/test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts\"},{\"assertionResults\":[],\"startTime\":1789120964479,\"endTime\":1789120964479,\"status\":\"failed\",\"message\":\"Transform failed with 1 error:\\n\\n\\u001b[31m[PARSE_ERROR] \\u001b[0mIdentifier `REMINDER_PROVIDER` has already been declared\\n     \\u001b[38;5;246m\u256d\\u001b[0m\\u001b[38;5;246m\u2500\\u001b[0m\\u001b[38;5;246m[\\u001b[0m tools/generate/src/cli/ai/host-core.ts:267:7 \\u001b[38;5;246m]\\u001b[0m\\n     \\u001b[38;5;246m\u2502\\u001b[0m\\n \\u001b[38;5;246m267 \u2502\\u001b[0m \\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249mo\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249ms\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249m \\u001b[0mREMINDER_PROVIDER\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m=\\u001b[0m\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mk\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m.\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mm\\u001b[0m\\u001b[38;5;249mi\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249md\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\n \\u001b[38;5;240m    \u2502\\u001b[0m       \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \\n \\u001b[38;5;240m    \u2502\\u001b[0m               \u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 `REMINDER_PROVIDER` has already been declared here\\n \\u001b[38;5;240m    \u2502\\u001b[0m \\n \\u001b[38;5;246m284 \u2502\\u001b[0m \\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249mo\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249ms\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249m \\u001b[0mREMINDER_PROVIDER\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m=\\u001b[0m\\u001b[38;5;249m \\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\u001b[38;5;249mc\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mt\\u001b[0m\\u001b[38;5;249ma\\u001b[0m\\u001b[38;5;249mk\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m.\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mm\\u001b[0m\\u001b[38;5;249mi\\u001b[0m\\u001b[38;5;249mn\\u001b[0m\\u001b[38;5;249md\\u001b[0m\\u001b[38;5;249me\\u001b[0m\\u001b[38;5;249mr\\u001b[0m\\u001b[38;5;249m'\\u001b[0m\\n \\u001b[38;5;240m    \u2502\\u001b[0m       \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \\n \\u001b[38;5;240m    \u2502\\u001b[0m               \u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 It can not be redeclared here\\n\\u001b[38;5;246m\u2500\u2500\u2500\u2500\u2500\u256f\\u001b[0m\\n\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-26/tests/test_UAT_FC_REQ-154_cloud_eyes.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a ticket created through the Worker is readable back through it\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the schema and the wiring\"],\"fullName\":\"REQ-162 \u2014 the schema and the wiring UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a missing binding refuses at construction, not at first use\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the tenant barrier\"],\"fullName\":\"REQ-162 \u2014 the tenant barrier UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 attachment ops work through the wired store\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 attachment ops work through the wired store\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 attachments\"],\"fullName\":\"REQ-162 \u2014 attachments UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 one tenant cannot address another tenant blob\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 material and reference validate the DOC-38 \u00a79 fields\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a bad rights or kind value is rejected\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 republishable and exportable must be stated, never inferred\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 captured and fetched material must say where it came from\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a brief names its site and carries its decisions\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-162 \u2014 the material types\"],\"fullName\":\"REQ-162 \u2014 the material types UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"status\":\"skipped\",\"title\":\"UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1789120964479,\"endTime\":1789120964479,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-26/tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "no filesystem-backed junction or archive can reach the deployed artifact test_UAT_AC1406_the_artifacts_import_graph_carries_no_filesystem_module_or_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the assistant library is bundled at build time test_UAT_AC1407_the_library_travels_in_the_artifact_and_a_missing_one_fails_the_build",
          "file": "",
          "status": "passed"
        },
        {
          "name": "the model key ships as a deploy secret test_UAT_AC1410_the_deploy_asks_the_deployment_and_rehearses_the_same_decision",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar re-derivation and control lifetime test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC959_renders_one_panel_per_declared_tab_and_opens_the_first",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a workspace chrome test_UAT_AC976_every_option_of_every_declared_tab_reaches_the_chrome",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC968_switching_modes_changes_the_source_without_rebuilding_the_pane",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a display panel modes test_UAT_AC969_a_mode_the_panel_has_never_heard_of_works_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC970_the_toolbar_renders_exactly_the_active_modes_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a toolbar test_UAT_AC971_open_in_a_new_tab_always_targets_the_displayed_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a split and persistence test_UAT_AC974_layout_state_survives_reopening_and_is_namespaced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the declaration the product ships test_UAT_AC1654_the_clients_knowledge_base_is_declared_with_exactly_the_four_record_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the scaffold a fresh workspace gets test_UAT_AC1658_a_fresh_workspace_is_scaffolded_the_shipped_client_knowledge_base_field_for_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 a host serves only what it can resolve test_UAT_AC1659_the_release_build_offers_exactly_the_shipped_knowledge_base",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_main_checkout_anchors_to_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_linked_working_tree_anchors_to_the_main_checkout",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_a_pointer_naming_no_shared_repository_anchors_to_its_own_directory",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_no_repository_data_anchors_to_the_walk_origin_and_terminates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component resolution anchors at the repository, not the location test_UAT_AC1030_linked_working_tree_and_main_checkout_consume_the_identical_copy",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1714 \u2014 a Library beside the site tab, in the workspace\u2019s own two panes test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1715 \u2014 the whole account\u2019s material, with the open site as a badge test_UAT_AC1715_the_list_spans_every_binding_and_only_the_open_site_row_is_badged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1716 \u2014 four axes, conjunctive, over the same listed material test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1717 \u2014 the file itself, and the rights record read-only test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights",
          "file": "",
          "status": "passed"
        },
        {
          "name": "AC-1718 \u2014 the description is the one editable thing test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a7a12d81 \u2014 the material store is declared on both halves of the deployment test_UAT_AC1490_both_halves_declare_the_material_store_and_name_the_same_target",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a7a12d81 \u2014 the material store is never the published-site store test_UAT_AC1489_neither_half_points_attachment_bytes_at_the_public_sites_store",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1725_the_overlay_asks_what_the_file_is_for_and_states_the_privacy_promise",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1726_dropping_files_into_an_area_commits_that_role_and_withdraws_the_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1727_every_area_is_activatable_without_dragging_and_commits_the_same_role",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1728_a_file_dropped_outside_both_areas_creates_nothing_and_says_what_is_missing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1729_only_a_file_drag_raises_the_overlay_and_it_stays_up_across_the_workspace",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 the overlay: the one question only the client can answer test_UAT_AC1734_dismissing_the_overlay_creates_nothing_and_the_next_raise_starts_clean",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1730_the_conversation_and_the_library_raise_the_one_same_overlay",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1731_a_conversational_handover_is_the_clients_own_turn_and_a_library_one_adds_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1732_a_handover_that_did_not_fully_succeed_reports_what_went_wrong",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1733_the_open_site_travels_with_the_handover_and_a_reference_file_is_never_placed",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-325da65f \u2014 two entry points, one interaction test_UAT_AC1735_several_files_are_reported_one_by_one_and_the_library_is_re_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a \u2014 a workspace that cannot start test_UAT_AC1403_a_workspace_that_cannot_start_explains_itself_in_the_page",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape below the floor test_UAT_AC1671_below_the_listing_budget_the_landscape_names_every_document_and_says_it_is_complete",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape below the floor test_UAT_AC1675_a_client_who_has_given_us_nothing_yet_is_told_so_in_words",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape below the floor test_UAT_AC1674_a_title_that_cannot_stand_alone_gets_an_excerpt_and_a_real_title_stands_alone",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape below the floor test_UAT_AC1672_the_complete_listing_emphasises_nothing_because_it_validated_no_way_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape below the floor test_UAT_AC1673_the_enumerate_cluster_switch_is_a_character_budget_not_a_document_count",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape above the floor test_UAT_AC1677_above_the_floor_with_a_describer_the_landscape_is_a_clustered_map_of_described_territories",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape above the floor test_UAT_AC1676_above_the_floor_with_no_describer_the_rebuild_refuses_by_name_and_the_previous_map_stands",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the landscape above the floor test_UAT_AC1670_one_map_per_client_knowledge_base_recycled_in_place_by_every_rebuild",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the material clock: indexed now, described behind test_UAT_AC1668_material_written_is_searchable_by_the_time_the_write_notification_returns",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the material clock: indexed now, described behind test_UAT_AC1669_the_map_rebuild_a_material_write_triggers_is_deferred_not_awaited_in_the_turn",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the conversation clock: batched, and never the map test_UAT_AC1666_a_grown_conversation_is_indexed_in_character_batches_and_the_batch_point_advances",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-ea7b4646 \u2014 the conversation clock: batched, and never the map test_UAT_AC1667_indexing_a_conversation_leaves_the_clients_map_exactly_as_it_was",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a7a12d81 \u2014 attaching bytes, and reading back what was attached test_UAT_AC1486_attached_bytes_come_back_as_a_record_naming_their_integrity_digest_and_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a7a12d81 \u2014 the bytes are in the material store and nowhere the public site reaches test_UAT_AC1487_attached_bytes_are_in_the_material_store_under_the_accounts_address_and_absent_from_the_public_sites",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a7a12d81 \u2014 record-derived addressing, scoped to the account test_UAT_AC1488_identical_bytes_are_two_objects_in_one_account_and_two_unreachable_objects_across_two",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-a7a12d81 \u2014 removing one record\u2019s bytes cannot break a sibling record test_UAT_AC1739_one_record_owns_one_object_so_removing_it_leaves_a_sibling_holding_the_same_content_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1688_a_document_that_carries_text_yields_its_own_words_and_its_own_declared_title",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1689_a_text_shaped_file_becomes_material_whose_body_is_its_decoded_contents",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1699_a_description_body_is_bounded_and_says_so_and_a_title_is_one_collapsed_line",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 82,
      "failed": 138,
      "total": 220,
      "failures": [
        {
          "test_name": "AC-1652 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1652 'The deployed session is primed with the map and granted a read-only surface confined to the system knowledge base on both axes' (uid=acceptance_criterion-646952b8) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1652.",
          "ac_uid": "acceptance_criterion-646952b8",
          "ac_id": "AC-1652",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1761 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1761 'The gate reports the verified identity it proved, not a yes/no' (uid=acceptance_criterion-d72e6bf9) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1761.",
          "ac_uid": "acceptance_criterion-d72e6bf9",
          "ac_id": "AC-1761",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1740 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1740 'An invite creates the person, the account, the owner membership and the active grant, all readable back' (uid=acceptance_criterion-aa26d407) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1740.",
          "ac_uid": "acceptance_criterion-aa26d407",
          "ac_id": "AC-1740",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1741 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1741 'The account's identifier is opaque and derived from nothing a human chose; the label is separate' (uid=acceptance_criterion-17f275a7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1741.",
          "ac_uid": "acceptance_criterion-17f275a7",
          "ac_id": "AC-1741",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1742 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1742 'A newly invited account owns one starter site whose published address cannot collide with another account's' (uid=acceptance_criterion-3f0182e4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1742.",
          "ac_uid": "acceptance_criterion-3f0182e4",
          "ac_id": "AC-1742",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1743 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1743 'Re-inviting a known address reports the existing person and account and creates nothing' (uid=acceptance_criterion-c7cfa975) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1743.",
          "ac_uid": "acceptance_criterion-c7cfa975",
          "ac_id": "AC-1743",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1744 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1744 'An address differing only in case or padding is the same person, at invite and at login' (uid=acceptance_criterion-890af8ec) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1744.",
          "ac_uid": "acceptance_criterion-890af8ec",
          "ac_id": "AC-1744",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1745 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1745 'Provisioning refuses when the platform tenant is unconfigured, naming what is missing' (uid=acceptance_criterion-3e2eaa0f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1745.",
          "ac_uid": "acceptance_criterion-3e2eaa0f",
          "ac_id": "AC-1745",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1746 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1746 'An account may hold several concurrent grants, with plan and status values the product does not issue today' (uid=acceptance_criterion-9d75e93a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1746.",
          "ac_uid": "acceptance_criterion-9d75e93a",
          "ac_id": "AC-1746",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1747 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1747 'A proven address with no person behind it is refused, and the refusal creates nothing' (uid=acceptance_criterion-148ed7e2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1747.",
          "ac_uid": "acceptance_criterion-148ed7e2",
          "ac_id": "AC-1747",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1748 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1748 'An invited person is admitted and bound to an account and one effective grant, deterministically' (uid=acceptance_criterion-c65eae15) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1748.",
          "ac_uid": "acceptance_criterion-c65eae15",
          "ac_id": "AC-1748",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1749 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1749 'Arrival is recorded on every attempt: first arrival never moves, latest always does, refused visits included' (uid=acceptance_criterion-aacc39c7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1749.",
          "ac_uid": "acceptance_criterion-aacc39c7",
          "ac_id": "AC-1749",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1750 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1750 'A grant that has not ended admits and one whose end has passed refuses' (uid=acceptance_criterion-5968d5c2) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1750.",
          "ac_uid": "acceptance_criterion-5968d5c2",
          "ac_id": "AC-1750",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1751 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1751 'A grant whose start is in the future does not admit' (uid=acceptance_criterion-cbbd3ee4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1751.",
          "ac_uid": "acceptance_criterion-cbbd3ee4",
          "ac_id": "AC-1751",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1752 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1752 'A revoked grant refuses whatever its dates say' (uid=acceptance_criterion-ddfa5b62) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1752.",
          "ac_uid": "acceptance_criterion-ddfa5b62",
          "ac_id": "AC-1752",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1753 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1753 'A membership that is not active refuses that person and leaves the account's grant untouched' (uid=acceptance_criterion-15ef9fae) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1753.",
          "ac_uid": "acceptance_criterion-15ef9fae",
          "ac_id": "AC-1753",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1754 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1754 'Where several grants cover now, the one preserving access longest is the effective one' (uid=acceptance_criterion-a15e3f06) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1754.",
          "ac_uid": "acceptance_criterion-a15e3f06",
          "ac_id": "AC-1754",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1755 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1755 'An identity carrying no email address is refused rather than failing' (uid=acceptance_criterion-a8dc03a6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1755.",
          "ac_uid": "acceptance_criterion-a8dc03a6",
          "ac_id": "AC-1755",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1756 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1756 'A person whose own record is not active is refused, without disturbing their account' (uid=acceptance_criterion-150f5bbd) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1756.",
          "ac_uid": "acceptance_criterion-150f5bbd",
          "ac_id": "AC-1756",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1757 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1757 'Admission is decided before any route is served, on every path' (uid=acceptance_criterion-fa37ba92) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1757.",
          "ac_uid": "acceptance_criterion-fa37ba92",
          "ac_id": "AC-1757",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1758 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1758 'Every refusal is byte-identical to the caller, forbidden rather than a challenge, and neither cached nor indexed' (uid=acceptance_criterion-766fc357) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1758.",
          "ac_uid": "acceptance_criterion-766fc357",
          "ac_id": "AC-1758",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1759 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1759 'The check that failed is recorded for the operator, distinguished per reason' (uid=acceptance_criterion-fea04c41) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1759.",
          "ac_uid": "acceptance_criterion-fea04c41",
          "ac_id": "AC-1759",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1760 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1760 'An invited and entitled person reaches the builder' (uid=acceptance_criterion-4c1d0046) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1760.",
          "ac_uid": "acceptance_criterion-4c1d0046",
          "ac_id": "AC-1760",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1736 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1736 'What the client said a file is for narrows the rights inferred from provenance, never widens them, and an answer outside the permitted two is refused rather than coerced' (uid=acceptance_criterion-637402ab) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1736.",
          "ac_uid": "acceptance_criterion-637402ab",
          "ac_id": "AC-1736",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1737 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1737 'How a material's description came to be is a declared pair of fields, so material needing describing again is selectable rather than guessable' (uid=acceptance_criterion-bc3b338f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1737.",
          "ac_uid": "acceptance_criterion-bc3b338f",
          "ac_id": "AC-1737",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1738 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1738 'The name a file arrived under is carried on the material's own record, so listing a client's material costs no lookup per row' (uid=acceptance_criterion-350a43ed) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1738.",
          "ac_uid": "acceptance_criterion-350a43ed",
          "ac_id": "AC-1738",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1719 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1719 'A corrected description is what retrieval answers with afterwards, not only what the screen shows' (uid=acceptance_criterion-1dd3f242) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1719.",
          "ac_uid": "acceptance_criterion-1dd3f242",
          "ac_id": "AC-1719",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1720 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1720 'A description the client wrote is recorded as theirs, so a later re-description pass does not select it' (uid=acceptance_criterion-6819cfd6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1720.",
          "ac_uid": "acceptance_criterion-6819cfd6",
          "ac_id": "AC-1720",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1721 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1721 'An empty or whitespace-only description is refused with its reason, and the stored description is unchanged' (uid=acceptance_criterion-dc4c56af) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1721.",
          "ac_uid": "acceptance_criterion-dc4c56af",
          "ac_id": "AC-1721",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1722 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1722 'Listing the account's material returns rows newest first carrying no descriptions, reading one adds its description, and neither reaches another account' (uid=acceptance_criterion-7a1805f5) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1722.",
          "ac_uid": "acceptance_criterion-7a1805f5",
          "ac_id": "AC-1722",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1723 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1723 'A material's file comes back as itself \u2014 its own bytes, its own content type, marked for display in place under its original name' (uid=acceptance_criterion-7af06dfc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1723.",
          "ac_uid": "acceptance_criterion-7af06dfc",
          "ac_id": "AC-1723",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1724 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1724 'An identifier that is not this account's material is answered not-found by every Library operation, and a write so answered changes nothing' (uid=acceptance_criterion-04e0650b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1724.",
          "ac_uid": "acceptance_criterion-04e0650b",
          "ac_id": "AC-1724",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1709 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1709 'A file handed over for a selected site is in that site's asset library when the hand-over returns, as a copy on the public side, under the name reported back' (uid=acceptance_criterion-9b6e19ad) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1709.",
          "ac_uid": "acceptance_criterion-9b6e19ad",
          "ac_id": "AC-1709",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1710 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1710 'Material whose rights record forbids republishing is refused promotion by every route, with nothing written to the site' (uid=acceptance_criterion-9522297b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1710.",
          "ac_uid": "acceptance_criterion-9522297b",
          "ac_id": "AC-1710",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1711 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1711 'Promotion never replaces an asset already live: a free name preserving the extension is used and reported' (uid=acceptance_criterion-98f8f69e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1711.",
          "ac_uid": "acceptance_criterion-98f8f69e",
          "ac_id": "AC-1711",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1712 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1712 'A placement that cannot complete is reported as a named failure on a successful hand-over, and the file is not lost' (uid=acceptance_criterion-55dc5a6c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1712.",
          "ac_uid": "acceptance_criterion-55dc5a6c",
          "ac_id": "AC-1712",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1713 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1713 'Material with no file behind it is refused promotion rather than publishing an empty asset' (uid=acceptance_criterion-69086cc3) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1713.",
          "ac_uid": "acceptance_criterion-69086cc3",
          "ac_id": "AC-1713",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1700 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1700 'Material is retrieved only over a secure web address; an insecure, non-web or unreadable address is refused and never silently upgraded' (uid=acceptance_criterion-cba8f37b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1700.",
          "ac_uid": "acceptance_criterion-cba8f37b",
          "ac_id": "AC-1700",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1701 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1701 'Addresses that mean something only inside the platform's own network are refused, and ordinary public addresses are permitted' (uid=acceptance_criterion-c2ee9857) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1701.",
          "ac_uid": "acceptance_criterion-c2ee9857",
          "ac_id": "AC-1701",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1702 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1702 'Every redirect hop is re-validated, and a hop the rules refuse is never retrieved' (uid=acceptance_criterion-9773a628) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1702.",
          "ac_uid": "acceptance_criterion-9773a628",
          "ac_id": "AC-1702",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1703 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1703 'A redirect chain is bounded: past a fixed limit the retrieval stops and says it redirected too many times' (uid=acceptance_criterion-ec9db7f4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1703.",
          "ac_uid": "acceptance_criterion-ec9db7f4",
          "ac_id": "AC-1703",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1704 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1704 'A retrieved body past the per-file ceiling is refused even when the remote server understated or omitted its size' (uid=acceptance_criterion-ce3b523c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1704.",
          "ac_uid": "acceptance_criterion-ce3b523c",
          "ac_id": "AC-1704",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1705 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1705 'A permitted retrieval yields the bytes and the bare content type, and the material records the final address it came from' (uid=acceptance_criterion-7ef52929) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1705.",
          "ac_uid": "acceptance_criterion-7ef52929",
          "ac_id": "AC-1705",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1706 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1706 'Retrieved material lands third-party, never republishable, exportable and as background to read, whatever the request claims' (uid=acceptance_criterion-2ed8fadb) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1706.",
          "ac_uid": "acceptance_criterion-2ed8fadb",
          "ac_id": "AC-1706",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1707 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1707 'A retrieval that brings back nothing usable \u2014 an error status, a redirect with no destination, an empty document \u2014 creates no material' (uid=acceptance_criterion-15e2337f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1707.",
          "ac_uid": "acceptance_criterion-15e2337f",
          "ac_id": "AC-1707",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1708 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1708 'An address the guard refuses never becomes material, and the refusal is the caller's error rather than a server failure or a rights refusal' (uid=acceptance_criterion-5b06d792) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1708.",
          "ac_uid": "acceptance_criterion-5b06d792",
          "ac_id": "AC-1708",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1678 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1678 'An ingested file becomes a stored material record whose body is its description, and the answer reports what was stored' (uid=acceptance_criterion-7e29a2bc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1678.",
          "ac_uid": "acceptance_criterion-7e29a2bc",
          "ac_id": "AC-1678",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1679 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1679 'Ingested bytes reside in the account's private material store and never in the store that serves the public internet' (uid=acceptance_criterion-065a54c4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1679.",
          "ac_uid": "acceptance_criterion-065a54c4",
          "ac_id": "AC-1679",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1680 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1680 'One account's ingested material is invisible to another account's listing and search' (uid=acceptance_criterion-11855dbf) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1680.",
          "ac_uid": "acceptance_criterion-11855dbf",
          "ac_id": "AC-1680",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1681 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1681 'An interruption during ingestion never leaves a record naming bytes that are not there' (uid=acceptance_criterion-df7735b6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1681.",
          "ac_uid": "acceptance_criterion-df7735b6",
          "ac_id": "AC-1681",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1682 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1682 'Kind is taken from the declared content type, from the filename where the type says nothing, and an unrecognised file is kept as a document' (uid=acceptance_criterion-7ffeab5a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1682.",
          "ac_uid": "acceptance_criterion-7ffeab5a",
          "ac_id": "AC-1682",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1683 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1683 'Rights are inferred from provenance and never asked: an upload lands owned, republishable and not exportable, whatever the request claims' (uid=acceptance_criterion-9c50e45e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1683.",
          "ac_uid": "acceptance_criterion-9c50e45e",
          "ac_id": "AC-1683",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1684 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1684 'A file over the ceiling, or with no bytes at all, is refused in words a client can act on and leaves no material behind' (uid=acceptance_criterion-8a0f6068) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1684.",
          "ac_uid": "acceptance_criterion-8a0f6068",
          "ac_id": "AC-1684",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1685 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1685 'Each created material is announced for indexing exactly once, identified by the material just created' (uid=acceptance_criterion-d3a3202b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1685.",
          "ac_uid": "acceptance_criterion-d3a3202b",
          "ac_id": "AC-1685",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1686 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1686 'New material is searchable the moment the ingestion returns, without re-processing the material already indexed' (uid=acceptance_criterion-b0598211) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1686.",
          "ac_uid": "acceptance_criterion-b0598211",
          "ac_id": "AC-1686",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1687 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1687 'With no indexer configured the file is still stored, and both the answer and the deployment log say it cannot be found' (uid=acceptance_criterion-c1ab33b4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1687.",
          "ac_uid": "acceptance_criterion-c1ab33b4",
          "ac_id": "AC-1687",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1651 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1651 'A conversation on the deployed runtime answers from a design document, names it, and ranks it above one that does not answer' (uid=acceptance_criterion-5050df7d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1651.",
          "ac_uid": "acceptance_criterion-5050df7d",
          "ac_id": "AC-1651",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1653 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1653 'No embedding model available is a second route to no knowledge operations, and the conversation still takes a turn' (uid=acceptance_criterion-b0d14eb7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1653.",
          "ac_uid": "acceptance_criterion-b0d14eb7",
          "ac_id": "AC-1653",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1634 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1634 'A reference document is written into the shipped corpus for every source, on every corpus export and every index build' (uid=acceptance_criterion-08983d5d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1634.",
          "ac_uid": "acceptance_criterion-08983d5d",
          "ac_id": "AC-1634",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1635 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1635 'Asking what is built reports the generated references separately from the exported documents' (uid=acceptance_criterion-ff6f99a8) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1635.",
          "ac_uid": "acceptance_criterion-ff6f99a8",
          "ac_id": "AC-1635",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1636 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1636 'A generated reference asserts its own knowledge-base membership, derived from the declaration rather than fixed' (uid=acceptance_criterion-f3d39c88) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1636.",
          "ac_uid": "acceptance_criterion-f3d39c88",
          "ac_id": "AC-1636",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1637 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1637 'Each corpus producer removes only what it no longer produces, and never the other's documents' (uid=acceptance_criterion-a060a56b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1637.",
          "ac_uid": "acceptance_criterion-a060a56b",
          "ac_id": "AC-1637",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1638 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1638 'A regenerated reference whose source has not changed keeps its existing timestamp' (uid=acceptance_criterion-37b1d8e6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1638.",
          "ac_uid": "acceptance_criterion-37b1d8e6",
          "ac_id": "AC-1638",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1639 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1639 'The component reference describes every component in the catalogue with its settings, value sets, page parts and obligations' (uid=acceptance_criterion-b2894766) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1639.",
          "ac_uid": "acceptance_criterion-b2894766",
          "ac_id": "AC-1639",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1640 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1640 'The component reference describes no component the catalogue does not carry' (uid=acceptance_criterion-4e782d0f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1640.",
          "ac_uid": "acceptance_criterion-4e782d0f",
          "ac_id": "AC-1640",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1641 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1641 'The layout reference names every element kind with its closed value sets, and the limits every page is held to' (uid=acceptance_criterion-b5fb535a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1641.",
          "ac_uid": "acceptance_criterion-b5fb535a",
          "ac_id": "AC-1641",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1642 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1642 'A harvested definition appears only against the shape it was written for' (uid=acceptance_criterion-9a4e5612) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1642.",
          "ac_uid": "acceptance_criterion-9a4e5612",
          "ac_id": "AC-1642",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1643 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1643 'The control-surface reference covers every declared operation, group, refusal and declared absence' (uid=acceptance_criterion-7e5ba7ab) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1643.",
          "ac_uid": "acceptance_criterion-7e5ba7ab",
          "ac_id": "AC-1643",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1644 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1644 'Every definition in a generated reference stands on its own, citing no internal ticket' (uid=acceptance_criterion-e573b281) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1644.",
          "ac_uid": "acceptance_criterion-e573b281",
          "ac_id": "AC-1644",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1645 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1645 'A generated reference names its source in its body and states that it is rebuilt on every build' (uid=acceptance_criterion-8e1fa65d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1645.",
          "ac_uid": "acceptance_criterion-8e1fa65d",
          "ac_id": "AC-1645",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1646 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1646 'Asking in words what a component supports returns a passage from the generated reference' (uid=acceptance_criterion-924d1362) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1646.",
          "ac_uid": "acceptance_criterion-924d1362",
          "ac_id": "AC-1646",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1057 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1057 'The conversation is stored through the store the site belongs to and replayed after the host that served it is gone' (uid=acceptance_criterion-aecd6a53) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1057.",
          "ac_uid": "acceptance_criterion-aecd6a53",
          "ac_id": "AC-1057",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1319 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1319 'A conversation is primed with the map and the operations manual, not with the documents, in that order' (uid=acceptance_criterion-bb427b19) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1319.",
          "ac_uid": "acceptance_criterion-bb427b19",
          "ac_id": "AC-1319",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1317 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1317 'The corpus is reachable from the same granted surface as the site operations, gated, marked untrusted and audited like an edit' (uid=acceptance_criterion-3590669c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1317.",
          "ac_uid": "acceptance_criterion-3590669c",
          "ac_id": "AC-1317",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1318 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1318 'The knowledge grant is read-only and names the system knowledge base on both scope axes from one declaration' (uid=acceptance_criterion-6a13867e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1318.",
          "ac_uid": "acceptance_criterion-6a13867e",
          "ac_id": "AC-1318",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1456 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1456 'A turn runs on a host process that never opened the session, and turns across processes stay one conversation' (uid=acceptance_criterion-29569117) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1456.",
          "ac_uid": "acceptance_criterion-29569117",
          "ac_id": "AC-1456",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1409 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1409 'Transcripts and the assistant's record live outside the storage region site files are addressed within, so no request address can name them' (uid=acceptance_criterion-fa74adda) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1409.",
          "ac_uid": "acceptance_criterion-fa74adda",
          "ac_id": "AC-1409",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1408 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1408 'No credential the host holds appears in a log, an error envelope or a client response, including inside a failing turn's stream' (uid=acceptance_criterion-e25d9b96) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1408.",
          "ac_uid": "acceptance_criterion-e25d9b96",
          "ac_id": "AC-1408",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1405 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1405 'A transcript is stored in one language-neutral form byte for byte, so a conversation written by either host loads in the other' (uid=acceptance_criterion-f53db14b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1405.",
          "ac_uid": "acceptance_criterion-f53db14b",
          "ac_id": "AC-1405",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1404 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1404 'A whole turn runs on the deployed host with the model key read from a deploy secret, and its edits land in the shared store' (uid=acceptance_criterion-a4905fba) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1404.",
          "ac_uid": "acceptance_criterion-a4905fba",
          "ac_id": "AC-1404",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1320 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1320 'No knowledge base packed is an ordinary state and is silent, on either host; one that was built and cannot be opened is reported' (uid=acceptance_criterion-ceeb657c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1320.",
          "ac_uid": "acceptance_criterion-ceeb657c",
          "ac_id": "AC-1320",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1061 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1061 'A failure after a turn has begun streaming is delivered inside the stream, followed by the completion that releases the caller' (uid=acceptance_criterion-ef29a3b6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1061.",
          "ac_uid": "acceptance_criterion-ef29a3b6",
          "ac_id": "AC-1061",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1060 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1060 'An assistant that cannot run is explained without losing the operator's conversation' (uid=acceptance_criterion-99c540d7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1060.",
          "ac_uid": "acceptance_criterion-99c540d7",
          "ac_id": "AC-1060",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1059 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1059 'A refused operation comes back to the assistant within the same turn as a named refusal it can correct, with the site untouched' (uid=acceptance_criterion-b982a7e0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1059.",
          "ac_uid": "acceptance_criterion-b982a7e0",
          "ac_id": "AC-1059",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1058 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1058 'Every operation the assistant is offered is granted, takes no site, and reaches no path' (uid=acceptance_criterion-24fae61d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1058.",
          "ac_uid": "acceptance_criterion-24fae61d",
          "ac_id": "AC-1058",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1056 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1056 'Two sites are two conversations: a turn changes only its own site, and each transcript holds only its own turns' (uid=acceptance_criterion-f06d0451) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1056.",
          "ac_uid": "acceptance_criterion-f06d0451",
          "ac_id": "AC-1056",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1055 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1055 'A conversation identifier that names no site this account holds is refused before anything is streamed, and starts no conversation' (uid=acceptance_criterion-7b488315) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1055.",
          "ac_uid": "acceptance_criterion-7b488315",
          "ac_id": "AC-1055",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1054 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1054 'A turn that changes the site streams what the assistant did and said, ends in exactly one completion, and the change is in the draft' (uid=acceptance_criterion-5df35b3c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1054.",
          "ac_uid": "acceptance_criterion-5df35b3c",
          "ac_id": "AC-1054",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1053 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1053 'A turn is addressed to a conversation, not a site; naming a site instead is refused and changes nothing' (uid=acceptance_criterion-33328c06) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1053.",
          "ac_uid": "acceptance_criterion-33328c06",
          "ac_id": "AC-1053",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1052 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1052 'Opening a conversation for a named site answers with its identifier, the turns already spoken, and whether a turn can be run' (uid=acceptance_criterion-15d1c12f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1052.",
          "ac_uid": "acceptance_criterion-15d1c12f",
          "ac_id": "AC-1052",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1051 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1051 'Asking what the assistant is answers with the role it offers and whether it can run, without opening a conversation' (uid=acceptance_criterion-fe61861f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1051.",
          "ac_uid": "acceptance_criterion-fe61861f",
          "ac_id": "AC-1051",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-979 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-979 'A request for a rendering channel or a component the workspace does not serve is answered as not found' (uid=acceptance_criterion-a54bfee4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-979.",
          "ac_uid": "acceptance_criterion-a54bfee4",
          "ac_id": "AC-979",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-978 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-978 'A request that tries to escape a served tree is never satisfied, identically on the channels and on every artifact prefix' (uid=acceptance_criterion-53c66f17) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-978.",
          "ac_uid": "acceptance_criterion-53c66f17",
          "ac_id": "AC-978",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-977 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-977 'Every response the workspace returns is served as non-cacheable through every front door, including the workspace document itself' (uid=acceptance_criterion-76d3ad8f) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-977.",
          "ac_uid": "acceptance_criterion-76d3ad8f",
          "ac_id": "AC-977",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-975 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-975 'The displayed site fills the browser window and follows a live resize, and the workspace page itself never scrolls' (uid=acceptance_criterion-86d9e15d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-975.",
          "ac_uid": "acceptance_criterion-86d9e15d",
          "ac_id": "AC-975",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-972 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-972 'Publishing from the workspace produces a new revision of the displayed site through the platform's existing publish path' (uid=acceptance_criterion-285b8c08) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-972.",
          "ac_uid": "acceptance_criterion-285b8c08",
          "ac_id": "AC-972",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-967 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-967 'The site selector lists exactly the sites the store holds, and choosing one changes the displayed site' (uid=acceptance_criterion-92c52943) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-967.",
          "ac_uid": "acceptance_criterion-92c52943",
          "ac_id": "AC-967",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-966 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-966 'The display panel's ordinary mode displays the selected site's own rendering, not a stand-in' (uid=acceptance_criterion-6fb2bebc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-966.",
          "ac_uid": "acceptance_criterion-6fb2bebc",
          "ac_id": "AC-966",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-965 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-965 'A deployment that names no account and one naming a deactivated account are reported as distinct, explanatory failures' (uid=acceptance_criterion-5286c04b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-965.",
          "ac_uid": "acceptance_criterion-5286c04b",
          "ac_id": "AC-965",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-964 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-964 'The workspace and everything it displays are reachable from one origin by an admitted caller, with nothing reinterpreted in between' (uid=acceptance_criterion-46d5804e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-964.",
          "ac_uid": "acceptance_criterion-46d5804e",
          "ac_id": "AC-964",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-963 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-963 'The workspace document references each component through the entry point that component itself declares' (uid=acceptance_criterion-78436279) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-963.",
          "ac_uid": "acceptance_criterion-78436279",
          "ac_id": "AC-963",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-962 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-962 'A component that is not installed produces a message naming the component and the command that installs it' (uid=acceptance_criterion-65d0dd94) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-962.",
          "ac_uid": "acceptance_criterion-65d0dd94",
          "ac_id": "AC-962",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-961 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-961 'The shared UI components are served byte-identical from an installed copy that lives outside this repository' (uid=acceptance_criterion-b1bcd8ef) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-961.",
          "ac_uid": "acceptance_criterion-b1bcd8ef",
          "ac_id": "AC-961",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1449 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1449 'A workspace deployed against a store holding only the schema serves, registering the one account its own configuration names and no other' (uid=acceptance_criterion-2180afc8) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1449.",
          "ac_uid": "acceptance_criterion-2180afc8",
          "ac_id": "AC-1449",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1402 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1402 'A local site's draft definition and assets copy into the shared store idempotently, through the same store the workspace serves from' (uid=acceptance_criterion-d541fbe9) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1402.",
          "ac_uid": "acceptance_criterion-d541fbe9",
          "ac_id": "AC-1402",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1401 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1401 'The operator's builder command is a transport over the one route table, defaulting to the local simulated store' (uid=acceptance_criterion-44b0be07) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1401.",
          "ac_uid": "acceptance_criterion-44b0be07",
          "ac_id": "AC-1401",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1400 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1400 'The browser client, the shared components and the framework bridges are build artifacts, served behind the gate and never resolved per request' (uid=acceptance_criterion-2131e298) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1400.",
          "ac_uid": "acceptance_criterion-2131e298",
          "ac_id": "AC-1400",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1399 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1399 'With no local process running, the deployed workspace serves its document, lists the store's sites, and renders both draft-side channels itself' (uid=acceptance_criterion-4b9f7f0c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1399.",
          "ac_uid": "acceptance_criterion-4b9f7f0c",
          "ac_id": "AC-1399",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1036 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1036 'A channel address resolves the same addresses it always did, and never anything outside its own channel' (uid=acceptance_criterion-46e9debf) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1036.",
          "ac_uid": "acceptance_criterion-46e9debf",
          "ac_id": "AC-1036",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1035 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1035 'The published way of looking at a site comes from the publish-time rendering and never from today's draft' (uid=acceptance_criterion-4d519076) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1035.",
          "ac_uid": "acceptance_criterion-4d519076",
          "ac_id": "AC-1035",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1034 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1034 'A draft that no longer validates is reported where the operator is looking, naming the offending field' (uid=acceptance_criterion-912dcc52) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1034.",
          "ac_uid": "acceptance_criterion-912dcc52",
          "ac_id": "AC-1034",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1033 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1033 'A definition changed outside the workspace is shown on the next request, with no render step and no restart \u2014 and two workspaces never share a rendering' (uid=acceptance_criterion-ae33f0ab) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1033.",
          "ac_uid": "acceptance_criterion-ae33f0ab",
          "ac_id": "AC-1033",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1032 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1032 'One render backs both the artifact written to disk and the bytes the origin serves \u2014 same file set, same bytes, both channels' (uid=acceptance_criterion-46534535) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1032.",
          "ac_uid": "acceptance_criterion-46534535",
          "ac_id": "AC-1032",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1031 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1031 'The draft-side channels answer from the origin with no rendered artifact on disk, and serving one writes nothing back' (uid=acceptance_criterion-e9a9ba3b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1031.",
          "ac_uid": "acceptance_criterion-e9a9ba3b",
          "ac_id": "AC-1031",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1029 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1029 'The workspace registers an editable mode, and selecting it displays that site's edit channel' (uid=acceptance_criterion-f1115dda) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1029.",
          "ac_uid": "acceptance_criterion-f1115dda",
          "ac_id": "AC-1029",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1453 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1453 'The automation identity is provisioned by a documented command that persists no secret' (uid=acceptance_criterion-996ba9b5) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1453.",
          "ac_uid": "acceptance_criterion-996ba9b5",
          "ac_id": "AC-1453",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1452 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1452 'A bounce to the sign-in page reads as an authentication refusal, never as success' (uid=acceptance_criterion-81aea86c) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1452.",
          "ac_uid": "acceptance_criterion-81aea86c",
          "ac_id": "AC-1452",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1451 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1451 'Half a service token is refused before any request is sent, and before the first site moves' (uid=acceptance_criterion-3763fb6b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1451.",
          "ac_uid": "acceptance_criterion-3763fb6b",
          "ac_id": "AC-1451",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1450 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1450 'An automation caller presents the service-token pair, never the assertion header the gateway forwards' (uid=acceptance_criterion-9f397aa0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1450.",
          "ac_uid": "acceptance_criterion-9f397aa0",
          "ac_id": "AC-1450",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1384 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1384 'Granted identities, both controls and how to verify them are recorded in the repository, with no credential' (uid=acceptance_criterion-b674f256) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1384.",
          "ac_uid": "acceptance_criterion-b674f256",
          "ac_id": "AC-1384",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1383 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1383 'The gate's configuration is declared for every environment the application deploys to' (uid=acceptance_criterion-b607d713) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1383.",
          "ac_uid": "acceptance_criterion-b607d713",
          "ac_id": "AC-1383",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1382 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1382 'The deployment answers on no address the gate does not front' (uid=acceptance_criterion-0beaf780) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1382.",
          "ac_uid": "acceptance_criterion-0beaf780",
          "ac_id": "AC-1382",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1381 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1381 'Refusals are neither stored by an intermediary nor indexed by a crawler' (uid=acceptance_criterion-8baa8d19) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1381.",
          "ac_uid": "acceptance_criterion-8baa8d19",
          "ac_id": "AC-1381",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1380 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1380 'A newly published signing key is honoured without a restart: the rotated token is not refused as unsigned' (uid=acceptance_criterion-ab58a7b1) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1380.",
          "ac_uid": "acceptance_criterion-ab58a7b1",
          "ac_id": "AC-1380",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1379 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1379 'Unobtainable signing keys deny rather than admit' (uid=acceptance_criterion-902f4e4b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1379.",
          "ac_uid": "acceptance_criterion-902f4e4b",
          "ac_id": "AC-1379",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1378 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1378 'An incompletely configured gate refuses everything with a distinct status naming the missing setting' (uid=acceptance_criterion-74ae12ec) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1378.",
          "ac_uid": "acceptance_criterion-74ae12ec",
          "ac_id": "AC-1378",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1377 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1377 'An unverifiable caller is refused, told which check failed, and never reaches anything behind the gate' (uid=acceptance_criterion-58011cbf) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1377.",
          "ac_uid": "acceptance_criterion-58011cbf",
          "ac_id": "AC-1377",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1376 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1376 'The identity is accepted by the gate from the forwarded header, the browser cookie, or an automation service identity' (uid=acceptance_criterion-3e14ac35) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1376.",
          "ac_uid": "acceptance_criterion-3e14ac35",
          "ac_id": "AC-1376",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1375 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1375 'A granted identity is not refused by the gate' (uid=acceptance_criterion-88b09307) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1375.",
          "ac_uid": "acceptance_criterion-88b09307",
          "ac_id": "AC-1375",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1499 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1499 'A conversation persists as a record found by its session identifier, with the transcript as a comment and the body left for a summary' (uid=acceptance_criterion-002fc710) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1499.",
          "ac_uid": "acceptance_criterion-002fc710",
          "ac_id": "AC-1499",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1498 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1498 'Material may name the site it was gathered for, or belong to the account at large' (uid=acceptance_criterion-77604abe) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1498.",
          "ac_uid": "acceptance_criterion-77604abe",
          "ac_id": "AC-1498",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1497 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1497 'A material is a valid record before any text has been extracted from it' (uid=acceptance_criterion-4d25f685) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1497.",
          "ac_uid": "acceptance_criterion-4d25f685",
          "ac_id": "AC-1497",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1496 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1496 'A brief names the site it belongs to and carries a document; one that names no site or says nothing is refused' (uid=acceptance_criterion-1668eba8) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1496.",
          "ac_uid": "acceptance_criterion-1668eba8",
          "ac_id": "AC-1496",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1495 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1495 'Captured and fetched material must name the address it came from; uploaded material is not asked for one' (uid=acceptance_criterion-6e6e1be0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1495.",
          "ac_uid": "acceptance_criterion-6e6e1be0",
          "ac_id": "AC-1495",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1494 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1494 'Republishability and exportability must be stated as true-or-false answers, never omitted and never inferred' (uid=acceptance_criterion-57b1fa42) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1494.",
          "ac_uid": "acceptance_criterion-57b1fa42",
          "ac_id": "AC-1494",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1493 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1493 'An ownership or file-sort value outside the permitted set is refused and no record is stored' (uid=acceptance_criterion-466481be) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1493.",
          "ac_uid": "acceptance_criterion-466481be",
          "ac_id": "AC-1493",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1492 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1492 'A material and a reference record rights and provenance in the same form, inferred from provenance, with what the client said the file is for as the one narrowing input' (uid=acceptance_criterion-535253fa) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1492.",
          "ac_uid": "acceptance_criterion-535253fa",
          "ac_id": "AC-1492",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1491 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1491 'The platform records client material as one of three named kinds, and the same vocabulary carries conversations and attached files' (uid=acceptance_criterion-bd29bb5d) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1491.",
          "ac_uid": "acceptance_criterion-bd29bb5d",
          "ac_id": "AC-1491",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  }
}