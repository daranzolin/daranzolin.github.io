---
layout: post
title:  "Prepare Progress Reports to Email with R, Canvas, and rcanvas"
date:   2016-10-06 21:00:02 -0700
categories: Tutorial
tags: rcanvas R
---
While neglecting my Python coursework this fall, [I wrote an rstats package called rcanvas.](https://github.com/daranzolin/rcanvas) 
`rcanvas` is an R client for the Canvas LMS API. It makes getting course data from your institution's Canvas LMS easy, and I've utilized it
in a variety of ways at work. [And despite the Canvas Developer community's tepid response,](https://community.canvaslms.com/message/50845) 
I am optimistic about its future. Perhaps a quick demonstration will help.

<!--more-->

In this post, I will show how to prepare progress updates with R. This post only addresses getting the necessary data from Canvas,
because [Jenny Bryan already has a fantastic tutorial on sending the emails.](https://github.com/jennybc/send-email-with-r) Note: before reading on, 
make sure your `CANVAS_API_TOKEN` is an environment variable in your `.Renviron`.

First, we load the required packages:

{% highlight r %}
library(rcanvas)
library(tidyverse) #wow, this line really is a thing a beauty
{% endhighlight %}

Next, we'll obtain the course ids for the courses to which we wish to send updates. At work I would chain a
`filter()` clause to `get_course_list()` to specify the precise courses, but that would be unique to me. 

{% highlight r %}
courses <- get_course_list()
{% endhighlight %}

`courses` is a `data.frame` with a variety of course information. To get each student's current grade *and* email, we'll
have to make two separate calls to `get_course_items()` within a custom function before iterating through a vector
of course ids.

{% highlight r %}
get_grades_and_emails <- function(id) {
    grades <- get_course_items(id, "enrollments") %>%
        filter(role == "StudentEnrollment") %>%
        select(user.sis_user_id, user.name, grades.current_score, course_id)
    emails <- get_course_items(id, "users", include = "email") %>%
        select(sis_user_id, email)
    left_join(grades, emails, by = c("user.sis_user_id" = "sis_user_id")
}

safe_function <- possibly(get_grades_and_emails, NULL) #avoids error failing

student_data <- courses$id %>%
    map(safe_function) %>%
    bind_rows() %>%
    left_join(courses %>% select(id, course_code), #here we join the course name onto the data.frame
              by = c("course_id" = "id"))
{% endhighlight %}

`student_data` now contains all the necessary data: each student's name, grade, email, and course name (or code). With `sprintf()`, you can 
construct a prose message that ties each of these elements in as stern or celebratory fashion as you wish.

More `rcanvas` functionality is forthcoming.

