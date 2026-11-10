---
title: Creating a dataset
description: Import files or data from an optional DHIS2 source
order: 1
category: User Guides
---

# Creating a dataset

Open **Datasets → New dataset → Upload files**. Select a Chap-format CSV and its GeoJSON boundaries.

The CSV columns are `time_period`, `location`, `disease_cases`, `population`, `rainfall` and `mean_temperature`. Each GeoJSON feature needs a `NAME_1` property matching a CSV location. Missing values can be represented by empty CSV cells. Periods must be consistent across the dataset.

Choose **Import dataset**. Chap imports the files and opens the evaluation form with the dataset selected. The current CSV endpoint names uploaded datasets `csv_file`.

For DHIS2 data, connect your instance in Settings and select **Import from DHIS2**. Select locations, periods and data items, inspect the data check, then import. This path supports naming datasets and mapping covariate columns.

On the **Datasets** page, click a dataset name to see how complete its target and covariates are in each period and which locations are missing values. When the DHIS2 import runs **Check data**, the same completeness chart previews the import before anything is saved.
