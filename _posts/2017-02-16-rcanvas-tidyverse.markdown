---
layout: post
title:  "rcanvas + the tidyverse"
date:   2017-02-16 20:27:02 -0700
categories: Post
tags: R rcanvas
---

`rcanvas` continues to grow. Thanks to the recent contributions from Chris Hua, getting user groups, announcements, and discussions from
your institution's Canvas instance has never been easier. More collaborators are welcome! 

By my lights, R package development should be attuned to the tidyverse. Piping output into a sequence of clear, logical functions not only 
makes for clean, readable code, but is an undeniably damned good time.

<!--more-->

The remainder of this post will showcase the interplay between the tidyverse and various `rcanvas` functions. 

### Getting Students, Teachers, or Observers

Here's how to get all Canvas students, teachers, or observers. The code flow is fairly intuitive. First, we get a data frame of
courses with `get_course_list`, requesting each course's term and total students. Second, we pipe the course ids into `purrr::map_df` and
`get_course_items`, requesting all the enrollments. Finally, we filter the data frame for active students, teachers, or observers.

{% highlight r %}

library(rcanvas)
library(tidyverse)

students <- get_course_list(include = c("term", "total_students")) %>% 
  filter(
    term.name == "2017 Spring",
    total_students > 0) %>% 
  .$id %>% 
  map_df(get_course_items, "enrollments") %>% 
  filter(type == "StudentEnrollment", #'TeacherEnrollment' for teachers, 'ObserverEnrollment' for observers
         enrollment_state == "active")
         
{% endhighlight %}

With the data in hand, you can filter by any relevant criteria. Say, for example, you want to know which students have been inactive
for more than a week.

{% highlight r %}

library(lubridate)
students %>%
  mutate(inactive_days = as.numeric(round(difftime(ymd(Sys.Date()), ymd_hms(last_activity_at), units = c("days"))))) %>% 
  filter(inactive_days >= 7)

{% endhighlight %}

Time to harangue those students!

### Getting Missing Assignments

Here's how to get all missing assignments for a course, multiple courses, students, or multiple students. Again, the code flow is intuitive. 
First, get the courses. Second, filter the course(s) you want. Third, pipe the course ids into `purrr::map_df`, and fourth, extend the pipe
with user ids into `get_user_items`. 

{% highlight r %}

biology_missing_assignments <- get_course_list(include = c("term", "total_students")) %>% 
  filter(
    term.name == "2017 Spring",
    total_students > 0,
    grepl("Biology", name)) %>% 
  .$id %>% 
  map_df(get_course_items, "enrollments") %>%
  filter(type == "StudentEnrollment",
         enrollment_state == "active") %>%
  .$user_id %>%
  map_df(get_user_items, "missing_assignments")

{% endhighlight %}

In sum, getting lots of data very quickly is just a matter of piping the course and user ids into various functions and letting
the tidyverse do its thing.

### What else can I get?

Lots! User page views, profiles, avatars, and observees, or course discussion topics, assignments, files, modules, pages, quizzes, folders, todos, settings, and more. If it's in the API docs, we've tried to include it.



