---
layout: post
title:  "Blurred Lines: Code, Comments, or Both?" 
subtitle: "Supercharged {dbplyr} with Abstractions"
date:   2021-07-31 13:15:02 -0700
categories: Post
tags: R
---

[The {dbplyr} package](https://github.com/tidyverse/dbplyr) is one of the greatest abstractions of all time. The purpose of this blog, however, is to further extend the abstractions into your IDE, scripts, and package code. The benefits are slight but worthwhile: a little less typing, a little less rote memory, and a little increased readability. In brief, we want the code to absorb the properties of comments.  

Consider the following table of student data:

{% highlight r %}
library(tidyverse)

sample100 <- partial(sample, size = 100, replace = TRUE)
students <- tibble(
  id = 1:100,
  age = sample100(20:30),
  gender = sample100(c("F", "M", "N")),
  ethnicity = sample100(c("Asian", "Black", "White", "Latinx", "Other")),
  stu_level = sample100(c("Freshmen", "Sophomore", "Junior", "Senior")),
  visa = sample100(c("F", "J", "N", "O", "C")),
  residence_status = sample100(c("A", "B", "C", "D")),
  pell_eligible = sample100(0:1),
  first_gen = sample100(0:1),
  academic_standing = sample100(c("Good", "Probation")),
  gpa = rnorm(100, 3, sd = 0.3),
  attempted_units = sample100(0:16),
  earned_units = sample100(0:16)
)

for (i in 1:10) students[[paste0("random_variable", i)]] <- sample100(1:100)
students <- students[,sample(ncol(students))]
students <- select(students, id, everything())

con <- DBI::dbConnect(RSQLite::SQLite(), ":memory:")
copy_to(con, students)
students2 <- tbl(con, "students")
glimpse(students2)
{% endhighlight %}

```
Rows: ??
Columns: 23
Database: sqlite 3.30.1 [:memory:]
$ id                <int> 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17…
$ pell_eligible     <int> 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, …
$ academic_standing <chr> "Probation", "Probation", "Good", "Good", "Probation", "P…
$ visa              <chr> "F", "O", "N", "F", "F", "N", "F", "N", "C", "C", "N", "O…
$ random_variable8  <int> 93, 16, 53, 22, 27, 22, 62, 53, 12, 23, 40, 65, 18, 38, 8…
$ random_variable4  <int> 88, 76, 67, 40, 13, 6, 70, 55, 57, 91, 28, 28, 71, 86, 21…
$ random_variable9  <int> 86, 25, 90, 73, 76, 74, 85, 42, 26, 53, 28, 35, 58, 4, 52…
$ stu_level         <chr> "Junior", "Junior", "Junior", "Junior", "Freshmen", "Soph…
$ ethnicity         <chr> "White", "White", "Black", "White", "Black", "Other", "As…
$ random_variable5  <int> 48, 21, 81, 8, 36, 61, 67, 33, 32, 49, 20, 2, 46, 31, 71,…
$ random_variable3  <int> 32, 19, 51, 14, 53, 93, 52, 45, 93, 82, 99, 39, 61, 96, 1…
$ random_variable6  <int> 63, 78, 15, 27, 87, 60, 2, 94, 50, 46, 26, 76, 27, 95, 70…
$ attempted_units   <int> 4, 3, 3, 10, 2, 8, 9, 1, 3, 15, 15, 4, 1, 8, 4, 12, 10, 1…
$ gender            <chr> "M", "M", "F", "N", "M", "N", "F", "M", "F", "N", "N", "F…
$ age               <int> 22, 25, 25, 25, 26, 24, 27, 27, 25, 25, 24, 22, 25, 25, 2…
$ random_variable10 <int> 29, 32, 35, 76, 89, 92, 30, 10, 28, 4, 66, 93, 4, 71, 56,…
$ earned_units      <int> 15, 6, 7, 11, 12, 12, 11, 9, 11, 6, 13, 2, 0, 8, 8, 1, 13…
$ random_variable1  <int> 14, 84, 75, 68, 98, 9, 17, 23, 36, 90, 93, 72, 99, 18, 80…
$ first_gen         <int> 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, …
$ residence_status  <chr> "D", "C", "B", "D", "A", "D", "A", "D", "A", "D", "A", "B…
$ gpa               <dbl> 2.842677, 2.698100, 3.359800, 2.377324, 3.072233, 2.74912…
$ random_variable7  <int> 11, 63, 66, 18, 22, 98, 65, 39, 43, 91, 22, 11, 13, 11, 8…
$ random_variable2  <int> 29, 19, 72, 28, 80, 2, 69, 28, 58, 84, 7, 70, 43, 9, 77, …
```

## Use 'snippets' for common select statements

This table has numerous variables, but suppose in your day-to-day work you typically select a handful. For example, most of the time I need demographic information or academic information or both. And given the table schema, I can't rely on any [{tidyselect} goodies.](https://tidyselect.r-lib.org/) I can, however, create [small, simple RStudio snippets](https://support.rstudio.com/hc/en-us/articles/204463668-Code-Snippets-in-the-RStudio-IDE) that inserts a list of variables into my script. 

To create a snippet, navigate to  Tools > Global Options > Code > Edit snippets. Here are two snippets I've created, one for demographic variables and one for academic variables:

```
snippet demos
	gender, ethnicity, pell_eligible, first_gen, age

snippet academics
	gpa, attempted_units, earned_units, academic_standing
```

By merely pressing tab after each word, this:

{% highlight r %}
students2 %>% 
  select(
    id,
    demos
    academics
  )
{% endhighlight %}

Becomes this:

{% highlight r %}
students2 %>% 
  select(
    id,
    gender, ethnicity, pell_eligible, first_gen, age,
    gpa, attempted_units, earned_units, academic_standing
  )
{% endhighlight %}

We (don't) Enjoy Typing.

## Use functions w/quosures for filter statements

I'm increasingly fond of inserting functions that return quosures in my `filter()` statements. Again, perhaps I am frequently applying the same filter, such as 'underclassmen.':

underclassmen <- function() quo(stu_level %in% c("Freshmen", "Sophomore"))

{% highlight r %}
students2 %>% 
  filter(
    !!underclassmen()
  ) %>% 
  count(stu_level)
{% endhighlight %}

```
  stu_level     n
  <chr>     <int>
1 Freshmen     21
2 Sophomore    29
```

Filtering functions are versatile and include parameters. Suppose I have three varying definitions of 'international' students:

{% highlight r %}
international <- function(type = c("def1", "def2", "def3")) {
  type <- match.arg(type)
  switch(
    type,
    "def1" = quo(visa == "N" & residence_status == "D"),
    "def2" = quo(visa %in% c("F", "J", "O")),
    "def3" = quo(visa %in% c("F", "J", "N", "O"))
  )
}

students2 %>% 
  filter(
    !!underclassmen(),
    !!international("def2")
  ) %>% 
  count(stu_level, visa)
{% endhighlight %}

```
  stu_level visa      n
  <chr>     <chr> <int>
1 Freshmen  F         4
2 Freshmen  J         6
3 Freshmen  O         6
4 Sophomore F         3
5 Sophomore J         7
6 Sophomore O         4
```

These quantity of these functions within our internal packages is growing. Not only am I typing less, I'm spared from having to recall or look up the details of each definition. Again, what I like about this approach is that it kind of blurs the lines between code and comments. The original syntax requires comments, the function abstraction does not.
