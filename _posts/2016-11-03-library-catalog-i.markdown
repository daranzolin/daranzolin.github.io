---
layout: post
title:  "Building a Library Catalog with R, Part I"
date:   2016-11-03 10:20:02 -0700
categories: Tutorial
tags: R education library
---

I have a habit of boasting about R's innumerable merits. One day, I was celebrating the arrival of a particular R package when my wife stopped
and asked me why--if R was so great--can't it build her an online catalog for her library? I accepted the challenge without hesitation, being 
infinitely confident in R, but only mildly sure of myself. R's besmirched reputation must be restored.

Some background: my wife is the librarian at a local high school. Her patrons, however, do not have the luxury of an electronic catalog; if they want to 
find a book, they must pester her. This is annoying for all parties. 

<!--more-->

In the next few posts, I will recount the process of creating this online catalog with R. The frequency of the posts will be determined by the
impatience of my client, so we'll see where this goes.

First, I needed the data. I recommended exporting her catalog from [Renweb](https://www.renweb.com/)--a not-so-great student information system (SIS)--
pushing the data to a Google Sheet, and sharing the copy with my personal google account. That's where we begin. Here's how I brought the data
into R:

{% highlight r %}
library(tidyverse)
library(googlesheets)

cat <- gs_title("MVA Catalog for OPAC") %>% 
  gs_read(ws = "713F4C10")
{% endhighlight %}

Now, let's inspect what we have:

```
cat
# A tibble: 4 × 22
  `Library: Create-a-Report`                                      X2         X3                          X4          X5
                       <int>                                   <chr>      <chr>                       <chr>       <chr>
1                         NA                                    <NA>       <NA>                        <NA>        <NA>
2                          2                    "Famous in my time": 1810-1812. Byron, George Gordon Byron, Non-fiction
3                          3 "---In pursuit of the American dream" /       <NA>                Dotson, Bob.   Biography
4                          4             ... Treks across the veldt;       <NA>       Waldeck, Theodore J., Non-fiction
# ... with 17 more variables: X6 <chr>, X7 <chr>, X8 <chr>, X9 <chr>, X10 <chr>, X11 <chr>, X12 <chr>, X13 <chr>,
#   X14 <chr>, X15 <chr>, X16 <chr>, X17 <chr>, X18 <chr>, X19 <chr>, X20 <chr>, X21 <chr>, X22 <chr>
```

Ugh, what a nightmare. From `View()` I got a closer look at the hideousness and observed the following:

1. The column headers were several rows down
2. There was data for a single entry in multiple rows
3. The catalog lacks ethnic diversity 

Alas, R can only help with the first two. Here was my first attempt:

{% highlight r %}
col_names <- cat %>% 
  slice(2)
  
cat <- cat %>% 
  slice(3:nrow(.))
names(cat) <- col_names

cat %>% 
  fill(Title) %>% 
  group_by(Title) %>% 
  mutate(Subjects = paste(Subjects, collapse = ", ")) %>%
  slice(1)
{% endhighlight %}

```
  Error in x[needs_ticks] <- paste0("`", gsub("`", "\\\\`", x[needs_ticks]),  : 
  NAs are not allowed in subscripted assignments
```
Yikes, there are `NA` values in the column names. Time to call in the `janitor`:

```
cat %>% 
  fill(Title) %>% 
  group_by(Title) %>% 
  mutate(Subjects = paste(Subjects, collapse = ", ")) %>%
  slice(1) %>% 
  janitor::clean_names() %>% #FYI this is a pretty awesome package
  ungroup() %>% 
  select(-na, -na_2)
  # A tibble: 1,493 × 20
                                                                  title
                                                                  <chr>
1                                           ... Treks across the veldt;
2                               "---In pursuit of the American dream" /
3                                                  "Famous in my time":
4                          100 questions you'd never ask your parents :
5                                            101 great American poems /
6                                                1066 [ten sixty-six] :
7                                                                1066 /
8                                                 13 days of midnight /
9                                                            1984:00:00
10 200 Years :a Bicentennial Illustrated History of the United States /
# ... with 1,483 more rows, and 19 more variables: subtitle <chr>, author <chr>, category <chr>, subcategory <chr>,
#   subjects <chr>, lccn <chr>, isbn_all <chr>, publisher <chr>, publish_year <chr>, volume <chr>, edition <chr>,
#   series <chr>, pages <chr>, reading_level <chr>, target_audience <chr>, statement_of_responsibility <chr>,
#   awards <chr>, other_detail <chr>, librarian_note <chr>
```


The real heros here were `tidyr::fill()`, which fills in missing values from the previous `Title` entry, and `janitor::clean_names()`, which scrubs the hell out of a character vector.
When it was all said and done, I could group the multiple subjects together from different rows, collapse them into a single row, slice the top,
and clean the column names. In Part II I'll jump into `shiny`.




