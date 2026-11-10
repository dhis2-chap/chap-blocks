---
title: Creating an evaluation
description: Evaluate one or more models on a saved dataset
order: 2
category: User Guides
---

# Creating an evaluation

Open **Evaluate → Overview → New evaluation**, or choose **New evaluation** beside a dataset.

Select a dataset, a target column and compatible models. Set the evaluation name and the backtest parameters: forecast horizon, split count, stride and retraining interval. The form checks that the dataset contains enough periods.

Submit the form. Chap schedules model jobs; follow their progress and logs in **Jobs**. Completed evaluations appear under **Evaluate → Overview**. Use **Benchmarks** to group models and compare scores on a common specification.

With a DHIS2 connection you can also choose **Import from DHIS2** and prepare observations directly from analytics.
