---
layout: post
title:  "Data Validation with assertr: Dates and Regular Expressions"
date:   2017-04-14 21:27:02 -0700
categories: Post
tags: R
---

Being introduced to a new R package is like going on a really good first date--you wish you had met the person sooner, you 
imagine doing all sorts of fun things together in the future, and you can't wait to blog about the experience. Okay, maybe just the 
first two. 

Such was my introduction to `assertr`, a brilliant data validation package [from rOpenSci.](https://ropensci.org/) It was love at first sight. And much like a great date, `assertr`'s bouquet of functions whisper sweet assurances into your console, 
increasing your confidence, pushing you forward, and enhancing your desirability. Okay, maybe just the first two again. 
Here's a little demonstration. 

<!--more-->

Let's create a data frame of hypothetical section codes, end dates, and students:

{% highlight r %}

library(assertr)
library(tidyverse)
library(stringr)

sample_5 <- partial(base::sample, size = 5, replace = TRUE)

scout <- tibble(
  section = list(
    offerings = c("APBIO", "STATS", "GEOM", "APPSYCH", "USHIS"),
    program = rep(1, 5),
    option = sample_5(1:4),
    semester = sample_5(0:3)
    ) %>% 
    pmap(paste0) %>% 
    map2_chr(sample_5(100:999), paste, sep = "-"),
  end_date = sample_5(seq(as.Date("2017-05-01"), as.Date("2017-05-30"), by = 1)),
  students = sample_5(20:40)
  )
scout

{% endhighlight %}

```
# A tibble: 5 × 3
         section   end_date students
           <chr>     <date>    <int>
1   APBIO142-262 2017-05-07       26
2   STATS110-684 2017-05-13       34
3    GEOM121-622 2017-05-15       27
4 APPSYCH121-158 2017-05-23       37
5   USHIS110-376 2017-05-26       38

```

Five hypothetical section codes, five hypothetical end dates, and five hypothetical quantities of students.
Now, before I begin a formal analysis of this data, I may want to verify some assumptions. 
Namely, that the section codes are formatted correctly, that all sections terminate in May, 
and that each section has more than one and less than 40 students. Here I define a regular expression and 
set the range of end dates:

{% highlight r %}

section_regex <- "^[:upper:]{3,}1[1-4][0-3]-\\d{3}t?$"
end_date_range <- seq(as.Date("2017-05-01"), as.Date("2017-05-31"), by = 1)

{% endhighlight %}

With these conditions set, I can test their validity via `verify`, and confirm no section has more than 40 students via `assert`:

{% highlight r %}

scout %>% 
  verify(str_detect(section, section_regex)) %>% 
  verify(end_date %in% end_date_range) %>% 
  assert(in_bounds(1, 40), students) %>% 
  summarize(total_students = sum(students))

{% endhighlight %}

```
# A tibble: 1 × 1
  total_students
           <int>
1            162
```

Confidence! Failure of either condition would have thrown an error.

[The assertr vignette](https://cran.r-project.org/web/packages/assertr/vignettes/assertr.html) does a terrific job explaining the nuances of `verify` and `assert`. 
It's worth a close read.

You can be sure that I will be going on many more dates with `assertr`. 
