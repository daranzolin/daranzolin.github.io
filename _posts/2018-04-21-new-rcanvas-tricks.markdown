---
layout: post
title:  "New rcanvas Tricks to Manage and Analyze your Canvas LMS Course"
date:   2018-04-21 13:15:02 -0700
categories: Post
tags: R rcanvas
---

Canvas is, in my humble opinion, the best LMS around, and [my second package rcanvas is for all the students, 
TAs, instructors, and analysts lucky enough to reside there.](https://github.com/daranzolin/rcanvas) A growing number of contributors has made
it easier than ever to automate various workflows, and I'm excited to show off some that new functionality here.

<!--more-->

### Adding Enrollments

Add enrollments to any published course.

{% highlight r %}

library(rcanvas) #devtools::install_github("daranzolin/rcanvas")
library(tidyverse)

list(
  course_id = 43432,
  user_ids = c(32324, 434423, 434343, 443242),
  type = "StudentEnrollment",
  state = "active"
) %>% 
  pmap(add_enrollments)

{% endhighlight %}

### Comment and Grade Submissions

Programatically comment and ~~shame~~ grade students.

{% highlight r %}

comment_submission(course_id = 1350207, assignment_id = 5681164, user_id = 4928217, "You get an F for using a for loop.")
grade_submission(1350207, 5681164, 4928217, grade = 55)

{% endhighlight %}

### Upload Files to a Course

Push files from your local machine to Canvas with `purrr`.

{% highlight r %}

png_files <- dir(pattern = ".png$")
list_upload <- list(course_id = 1185256, file_name = png_files)
pwalk(list_upload, upload_course_file)

{% endhighlight %}

### Get a Course Gradebook

Get a tidied gradebook ready for visualization.

{% highlight r %}

get_course_gradebook(course_id = 43423)

{% endhighlight %}

### Add Users to a Group

You could identify and assign students to a group programatically.

{% highlight r %}

add_multiple_group_users(group_id=c(23, 24), user_ids=c(327, 328))

{% endhighlight %}

### Create Assignments

Create assignments in R.

{% highlight r %}

create_course_assigment(course_id = 1185256, 
                        name = "Readings 1", 
                        points_possible = 100, 
                        unlock_at = "2018-05-01T08:00:00Z", 
                        due_at = "2018-06-01T20:00:00Z", 
                        description = "Readings in Post-Structuralist and Lacanian Feminism: Saussere, Derrida, Kraftchick", 
                        published = TRUE)

{% endhighlight %}


And much much more! [Check the README for additional features,]((https://github.com/daranzolin/rcanvas)) file an issue if you encounter any issues, or submit a pull request
to add something new!

