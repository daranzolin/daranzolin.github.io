---
layout: post
title:  "Building Complex SQL Queries with R"
date:   2020-07-24 13:15:02 -0700
categories: Post
tags: R
---
 
[The {dbplyr} package](https://dbplyr.tidyverse.org/) is a godsend for tidyverse devotees. While SQL has its own elegance and expressiveness, once you go `tbl() %>% ... %>% collect()`, you can never go back. Ah, but I must immediately hedge: there are admittedly some tasks whose complexity requires a more...intimate interaction with the database. 

<!--more--> 

The purpose of this post is to demonstrate how to build-up moderately complex SQL queries using the {glue} and {purrr} packages. Our toy database features one table ("academic_standings") populated by fake students with fake academic standings (e.g. "Probation", "Good") from fake terms. Terms are chronological: term 1 is followed by term 2, which is followed by term 3, etc. And each student resides in a college and department. Students are assigned an academic standing after the term. If their academic performance drops below a certain threshold, their status becomes 'Probation'. Otherwise, it is 'Good': 

```
# Source:   lazy query [?? x 5]
# Database: sqlite 3.30.1 [:memory:]
  id      term college   department    acad_standing
  <chr>  <dbl> <chr>     <chr>         <chr>        
1 002771     1 College E Department 13 Good         
2 02cceb     1 College C Department 8  Probation    
3 02e5ab     1 College E Department 15 Probation    
4 048690     1 College E Department 13 Good         
5 070bb5     1 College B Department 6  Good         
6 0719d2     1 College B Department 5  Good  
```

We're interested in how many students are able to bounce back from probation. More specifically, we're interested in what proportion of students return to 'Good' status *after* being on 'Probation'. This calculation requires stepping through each term, counting the number of students on probation, *then checking their status in the next term.* If it's 'Good', then they've bounced back. Otherwise, they've remained on probation or departed the data set.

This query is easy to write for any two consecutive terms. But you really don't want to copy and paste the same query over and over again while changing a few WHERE clauses. Instead, once we have the query structure in place, we can write a function and loop through each sequential pair of terms, creating one query per pair. 

First, let's generate our sequential term pairs:

{% highlight r %}
library(glue)
library(tidyverse)

terms <- 1:8
first_term <- head(terms, -1)
second_term <- discard(lead(terms), is.na) 
(paired_terms <- map2(ft, st, c))
{% endhighlight %}

```
[[1]]
[1] 1 2

[[2]]
[1] 2 3

[[3]]
[1] 3 4

[[4]]
[1] 4 5

[[5]]
[1] 5 6

[[6]]
[1] 6 7

[[7]]
[1] 7 8
```

Next, let's wrap our initial SQL query inside a function, inserting the terms via {glue}:

{% highlight r %}
format_query <- function(term_pair) {
  glue("
     SELECT lhs.college,
            lhs.department,
            CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
     FROM (
        SELECT id,
               college, 
               department,
               acad_standing
      FROM academic_standings
      WHERE term = '{term_pair[1]}'
      AND acad_standing = 'Probation'
    ) lhs
     LEFT JOIN (
      SELECT id,
             acad_standing
      FROM academic_standings
      WHERE term = '{term_pair[2]}'
    ) rhs
    ON lhs.id = rhs.id
   ")
}
{% endhighlight %}

The query finds all the students on probation in the initial term and returns three columns: the college, department, and if the student returned to 'Good' status the following term. If they did, we'll set them to 1 since we want to do some arithmetic later.

Now we'll loop through our term pairs with {purrr} before collapsing each query with the set logic "UNION ALL":

{% highlight r %}
query1 <- paired_terms %>% 
  map(format_query) %>% 
  glue_collapse(sep = "\nUNION ALL\n")
{% endhighlight %}

If you squint, you can maybe see some '{dplyr}'-like logic: filter this term, then this term, mutate this column, then bind all the rows together. That's my mental model for translation.

`query1` is already 139 lines long. Open the accordian below and imagine typing that monstrosity.

<details>
  <summary>Monstrous query</summary>
  
```
SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
    FROM (
     SELECT id,
            college, 
            department,
            acad_standing
     FROM academic_standings
     WHERE term = '1'
     AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '2'
 ) rhs
 ON lhs.id = rhs.id
UNION ALL
  SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
  FROM (
     SELECT id,
            college, 
            department,
            acad_standing
   FROM academic_standings
   WHERE term = '2'
   AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '3'
 ) rhs
 ON lhs.id = rhs.id
UNION ALL
  SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
  FROM (
     SELECT id,
            college, 
            department,
            acad_standing
   FROM academic_standings
   WHERE term = '3'
   AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '4'
 ) rhs
 ON lhs.id = rhs.id
UNION ALL
  SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
  FROM (
     SELECT id,
            college, 
            department,
            acad_standing
   FROM academic_standings
   WHERE term = '4'
   AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '5'
 ) rhs
 ON lhs.id = rhs.id
UNION ALL
  SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
  FROM (
     SELECT id,
            college, 
            department,
            acad_standing
   FROM academic_standings
   WHERE term = '5'
   AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '6'
 ) rhs
 ON lhs.id = rhs.id
UNION ALL
  SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
  FROM (
     SELECT id,
            college, 
            department,
            acad_standing
   FROM academic_standings
   WHERE term = '6'
   AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '7'
 ) rhs
 ON lhs.id = rhs.id
UNION ALL
  SELECT lhs.college,
         lhs.department,
         CASE WHEN rhs.acad_standing = 'Good' THEN 1 ELSE 0 END AS off_probation 
  FROM (
     SELECT id,
            college, 
            department,
            acad_standing
   FROM academic_standings
   WHERE term = '7'
   AND acad_standing = 'Probation'
 ) lhs
  LEFT JOIN (
   SELECT id,
          acad_standing
   FROM academic_standings
   WHERE term = '8'
 ) rhs
 ON lhs.id = rhs.id
```
</details>

Now, this query may be far from optimized, but the gain in developer time vs. computation time is an easy tradeoff. Especially when dealing with small to medium-sized data.

Let's peek at the result:

{% highlight r %}
head(dbGetQuery(con, query1))
{% endhighlight %}

```
    college    department off_probation
1 College C  Department 8             0
2 College E Department 15             1
3 College C  Department 7             1
4 College C  Department 8             0
5 College B  Department 6             0
6 College C  Department 9             0
```

From term 1 to term 8, each row is a student on probation. If off_probation is 1, they returned to 'Good' standing in the immediately following term.

Now we can treat `query1` as a regular subquery and perform some aggregation:

{% highlight r %}
query2 <- glue("
  SELECT college,
         department,
         SUM(off_probation) off_probation,
         COUNT(*) AS students,
         SUM(off_probation * 1.0)/COUNT(*) AS off_probation_perc
  FROM
  ({query1})
  GROUP BY college, department
               ")
{% endhighlight %}

Next result:

{% highlight r %}
dbGetQuery(con, query2)
{% endhighlight %}

```
     college    department off_probation students off_probation_perc
1  College A  Department 1            21       44          0.4772727
2  College A  Department 2            14       40          0.3500000
3  College A  Department 3            21       39          0.5384615
4  College B  Department 4            19       35          0.5428571
5  College B  Department 5            17       45          0.3777778
6  College B  Department 6             9       32          0.2812500
7  College C  Department 7            17       34          0.5000000
8  College C  Department 8            19       40          0.4750000
9  College C  Department 9            11       28          0.3928571
10 College D Department 10            18       39          0.4615385
11 College D Department 11            17       30          0.5666667
12 College D Department 12            16       43          0.3720930
13 College E Department 13             9       27          0.3333333
14 College E Department 14            17       36          0.4722222
15 College E Department 15            13       36          0.3611111
```

And just for fun, let's slap another SELECT statement on top of this with some additional formatting and ranking:

{% highlight r %}
query3 <- glue("
  SELECT *,
         ROUND(off_probation_perc, 2) AS off_probation_perc,
         RANK() OVER(PARTITION BY college ORDER BY off_probation_perc DESC) AS intra_college_rank,
         RANK() OVER(ORDER BY off_probation_perc DESC) AS overall_rank
  FROM ({query2})
  ORDER BY off_probation_perc DESC
              ")

dbGetQuery(con, query3)
{% endhighlight %}

```
     college    department off_probation students off_probation_perc intra_college_rank overall_rank
1  College D Department 11            17       30               0.57                  1            1
2  College A  Department 3            21       39               0.54                  1            3
3  College B  Department 4            19       35               0.54                  1            2
4  College C  Department 7            17       34               0.50                  1            4
5  College A  Department 1            21       44               0.48                  2            5
6  College C  Department 8            19       40               0.48                  2            6
7  College E Department 14            17       36               0.47                  1            7
8  College D Department 10            18       39               0.46                  2            8
9  College C  Department 9            11       28               0.39                  3            9
10 College B  Department 5            17       45               0.38                  2           10
11 College D Department 12            16       43               0.37                  3           11
12 College E Department 15            13       36               0.36                  2           12
13 College A  Department 2            14       40               0.35                  3           13
14 College E Department 13             9       27               0.33                  3           14
15 College B  Department 6             9       32               0.28                  3           15
```
The full query has balooned to 154 lines...but we only had to type a fraction of it thanks to {purrr} and {glue}, and the sequential buildup of the query was much more intuitive to think through. Saving your intermediate queries as strings helps you work through the block-like, SQL logic. {purrr} is your wand, {glue} is your mortar.

