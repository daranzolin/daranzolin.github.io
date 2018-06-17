---
layout: post
title:  "Calculate Ethnic Diversity Index (EDI) with R"
date:   2016-10-30 12:48:02 -0700
categories: Tutorial
tags: R education
---

How diverse is your student body? A tour through some classrooms may give you some idea. But how diverse is your student body *in relation
to the school across town?* To answer that question, you need a more precise measure. Enter [Ethnic Diversity Index (EDI),](https://www.ed-data.k12.ca.us/Pages/EthnicDiversityIndex.aspx)
a reflection of how evenly distributed your students are among the race/ethnicity categories reported to the California Department of Education.

<!--more-->

[The precise formula can be found on Ed-Data's old website,](https://www.ed-data.k12.ca.us/Pages/Ethnic-Diversity-Index-Calculation.aspx) but it is obviously of little value
until put into a computational environment. Here's one possible instantiation in R:

{% highlight r %}
library(tidyverse)
edi <- function(student_df) {
  if (!is.data.frame(student_df)) stop("student_df must be a data frame")
  if (!"ethnicity" %in% names(student_df)) stop("ethnicity must be a column")
  
  unreported_eths <- c("Decline/Don't know", "Other", "")
  unreported_fraction <- sum(student_df$ethnicity %in% unreported_eths)/
                         sum(!student_df$ethnicity %in% unreported_eths)
  diversity_rating <- student_df %>% 
    filter(!ethnicity %in% unreported_eths) %>% 
    split(.$ethnicity) %>% 
    map(~ nrow(.)/nrow(student_df)/(1-unreported_fraction)) %>% 
    map_dbl(~ (. - (1/13))^2) %>% #There are thirteen reported ethnicities in my work
    sum(.) %>%
    sqrt(.)
  c2 <- -100 * sqrt(13*(13-1))/(13-1)
  100 + (c2 * diversity_rating)
}
{% endhighlight %}

EDI is calculated on a 0-100 scale: indices closer to zero indicate less diversity, and indices approaching 100 indicate great diversity. 
As Ed-Data explains:

> ...a school that had exactly 1/8th of its students in each of the eight categories would have an Ethnic Diversity Index of 100, and a school where all of the students are the same ethnicity would have an index of 0. In reality, of course, no school has an index of 100 (although a few have diversity indices of 0). Currently the highest index for a school is 76.

Let's test our function with some simulated data of a perfectly balanced student body:

{% highlight r %}
df1 <- data.frame(ethnicity = sample(letters, 13, replace = FALSE))
edi(df1)
[1] 100
{% endhighlight %}

Precisely what we wanted.

