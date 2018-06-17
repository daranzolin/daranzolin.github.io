---
layout: post
title:  "Planning your UCSC Extension Program Schedule with Web Scraping and the tidyverse"
date:   2018-05-27 13:15:02 -0700
categories: Post
tags: R 
---


Have you ever started a project unsure how to accomplish several of the required tasks? Perhaps you were optimistic you would figure it out eventually, or (more likely) that you would find someone on the internet who had already figured it out for you. Such was my hope when I set out to design a program scheduler for [UCSC Silicon Valley Extension.](https://www.ucsc-extension.edu) While the end result was only a mild success, far be it from me to let all that code remain unattended on my computer. This is catharsis by blogging.

My original goal was to design an algorithm that could generate a hypothetical schedule under given constraints such as cost, weekday availability, preference for online classes, etc. I also wanted to calculate time-to-completion and perhaps cluster related courses together. The task ultimately proved beyond my skill, time, energy, and interest, but I maintain there is some interesting code to my approximation here. Besides serving as a general tour of web scraping and the tidyverse, I was pushed into some new coding conventions. To name a few: I wrote my first ever `while` loop; I unpacked a vector with the `zeallot` package; I wrote a print method; I dug into CSS selectors; and simplified function calls with `partial()`. All in all, a character-building and fruitful experience.

<!--more-->

### Getting the Program Data

I needed data about Extension’s courses--the more the merrier. As an employee, I could have retrieved the data through other means, but I enjoy web scraping and was curious if one could rely solely on our public website.

I first navigated to [the schedule of Internet Programming and Development,](https://www.ucsc-extension.edu/certificate-program/software-development/internet-programming) the program in which I am currently enrolled. Before attempting to scrape any website, you should make sure it’s legal: most sites have Terms and Conditions forbidding any sort of web crawler or scraper. A quick way to check is with the `robotstxt` package:
{% highlight r %}

robotstxt::paths_allowed("https://www.ucsc-extension.edu/certificate-program/software-development/internet-programming")
 www.ucsc-extension.edu 
 
{% endhighlight %}
 
```
[1] TRUE
```

We’re good.

The offering data on the page resides in several tables but presents an interesting conundrum--some of the data is represented by images. Fortunately, these icons have “alt” html tags that indicate what they represent. The icon highlighted below, for example, has an alt tag of “Classroom and Online”:

![useful image]({{ site.url }}/assets/unexcss.png)

After some tinkering, the `.cols-7 .views-field` CSS selector will scrape 252 nodes from this page, one for every table cell. Because the structure of each table is identical, we can reformat the nodes into a single table without much effort.

First, we load our packages, read the HTML, and define some helper functions to parse data:

{% highlight r %}

library(rvest)
library(stringr)
library(lubridate)
library(tidyverse)
library(zeallot)

url <- "https://www.ucsc-extension.edu/certificate-program/software-development/internet-programming"
program_html <- read_html(url) 

node_has_image <- function(node) {
  x <- html_nodes(node, "img")
  ifelse(length(x) > 0, TRUE, FALSE)
}

parse_image_node <- function(node) {
  node %>% 
    html_nodes("img") %>% 
    html_attr("alt")
}
parse_string_node <- function(node) {
  node %>% 
    html_text() %>% 
    str_remove_all("\t|\n") %>% 
    str_trim()
}
parse_xml_node <- function(node) {
  has_img <- node_has_image(node)
  if (has_img) {
    val <- parse_image_node(node)
  } else {
    val <- parse_string_node(node)
  }
  val
}

{% endhighlight %}

In brief, `parse_xml_node()` checks if the node contains an image, extracts the “alt” label if it does, or extracts the text if it doesn’t. Then we can loop through each node accordingly:

{% highlight r %}

all_table_nodes <- program_html %>%
  html_nodes(".cols-7 .views-field") %>%
  map_chr(parse_xml_node)

#Same idea, just isolating the “Core” classes vs. “Electives”
cores <- program_html %>% 
  html_nodes(".views-field-view:nth-child(4) .views-row-last .views-field-field-offeringcode") %>% 
  map_chr(parse_xml_node)

head(all_table_cells, 28)

{% endhighlight %}

```
 [1] "Offering Code"                                                      "Offering"                                                          
 [3] "Units"                                                              "Fall"                                                              
 [5] "Winter"                                                             "Spring"                                                            
 [7] "Summer"                                                             "O-CE0359"                                                          
 [9] "Internet Programming & Development Certificate Completion Review"   ""                                                                  
[11] ""                                                                   ""                                                                  
[13] ""                                                                   ""                                                                  
[15] "Offering Code"                                                      "Offering"                                                          
[17] "Units"                                                              "Fall"                                                              
[19] "Winter"                                                             "Spring"                                                            
[21] "Summer"                                                             "LINX.X401"                                                         
[23] "LAMP: Linux Based Web Application Development – Apache, MySQL, PHP" "3.0"                                                               
[25] "Online"                                                             "Classroom and Online"                                              
[27] "Online"                                                             "Classroom and Online" 
```

You may notice that there are four rows and seven columns worth of data in these 28 elements. The columns are every seventh element, so we need to define a function that plucks them out while shifting the starting point of the sequence:

{% highlight r %}

get_every <- function(vec, start, nth) vec[seq(start, length(vec), nth)]
ge <- partial(get_every, vec = all_table_cells, nth = 7)
c(code, name, units, fall, winter, spring, summer) %<-% map(1:7, ge)

{% endhighlight %}

We’ll return to the `get_every()` function later, so I simplified the subsequent calls with `partial()` from the `purrr` package before unpacking the subsequent list with the `zeallot` operator. I now have seven vectors of length 36. Assigning them to columns within a tibble, and then tidying the subsequent data is done as follows:

{% highlight r %}

program_data <- tibble(code, name, units, fall, winter, spring, summer) %>% 
  filter(name != "Offering") %>% #removes the header rows
  gather(quarter_name, availability, fall:summer, -code, -name, -units) %>% 
  distinct(code, quarter_name, .keep_all = TRUE) %>% 
  arrange(name) %>% 
  mutate(category = case_when(
    code %in% cores ~ "Core",
    TRUE ~ "Elective"),
    units = as.numeric(units))

program_data

{% endhighlight %}

```
# A tibble: 116 x 6
   code      name                               units quarter_name availability category
   <chr>     <chr>                              <dbl> <chr>        <chr>        <chr>   
 1 CMPR.X402 C# .NET Programming, Advanced      3.00  fall         Online       Elective
 2 CMPR.X402 C# .NET Programming, Advanced      3.00  winter       Blended      Elective
 3 CMPR.X402 C# .NET Programming, Advanced      3.00  spring       Online       Elective
 4 CMPR.X402 C# .NET Programming, Advanced      3.00  summer       Blended      Elective
 5 CMPR.X403 C# .NET Programming, Comprehensive 3.00  fall         Blended      Elective
 6 CMPR.X403 C# .NET Programming, Comprehensive 3.00  winter       Online       Elective
 7 CMPR.X403 C# .NET Programming, Comprehensive 3.00  spring       Blended      Elective
 8 CMPR.X403 C# .NET Programming, Comprehensive 3.00  summer       Online       Elective
 9 IPDV.X400 Cloud Computing, Introduction      0.500 fall         Classroom    Elective
10 IPDV.X400 Cloud Computing, Introduction      0.500 winter       ""           Elective
# ... with 106 more rows
```
### Getting the Offering Data

This is a good start, but I need additional data on the individual offering pages. To pull out the urls, I extract all the anchor nodes and href attributes from the html file, filter out the unwanted urls, and reformat the paths with the UCSC Extension domain:

{% highlight r %}

offering_urls <- program_html %>% 
  html_nodes("a") %>% 
  html_attr("href") %>%
  keep(~str_detect(., "certificate-program/offering")) %>% 
  discard(~str_detect(., "completion-review")) %>% 
  map_chr(~paste0("https://www.ucsc-extension.edu", .))

offering_urls

all(paths_allowed(offering_urls))
head(offering_urls)

{% endhighlight %}

```
[1] "https://www.ucsc-extension.edu/certificate-program/offering/lamp-linux-based-web-application-development-–-apache-mysql-php"      
[2] "https://www.ucsc-extension.edu/certificate-program/offering/javascript-and-ajax-comprehensive"                                    
[3] "https://www.ucsc-extension.edu/certificate-program/offering/developing-enterprise-java-applications-spring-boot-and-microservices"
[4] "https://www.ucsc-extension.edu/certificate-program/offering/mobile-payments-e-commerce-security-and-cryptocurrency"               
[5] "https://www.ucsc-extension.edu/certificate-program/offering/lamp-linux-based-web-application-development-–-apache-mysql-php"      
[6] "https://www.ucsc-extension.edu/certificate-program/offering/java-programming-beginners"  

```
I can then loop through the urls, scraping and aggregating the table data in a similar fashion. It’s courteous to the website to delay iterative web scraping, so I’m calling a five second delay up front:

{% highlight r %}

scrape_offering_info <- function(url) {
  Sys.sleep(5)
  oHTML <- read_html(url)
  ot <- oHTML %>% 
    html_nodes(".post-content td , .post-content th") %>% 
    html_text()
#Some offerings do not have any upcoming sections
  if (length(ot) < 1) {
    message(sprintf("No sections available for %s...\n", url))
    df <- tibble()
  } else {
    ge <- partial(get_every, vec = ot, nth = 8)
    c(section, start_date, start_time, location, cost, instructor) %<-% map(1:6, ge)
    df <- tibble(section, start_date, start_time, location, cost, instructor) %>% slice(-1)
    message(sprintf("Parsing success for %s...\n", url))
  }
  df
}

offering_data <- offering_urls %>% 
  map_dfr(scrape_offering_info)
  
{% endhighlight %}

All that remains is some additional tidying, mutating, and joining.  Here I’m just trying to create additional variables for users to set their preferences against when it comes time to creating the hypothetical schedules.

{% highlight r %}

offering_data <- offerings %>% 
  rowwise() %>% 
  mutate(code = str_split(section, "\\.\\(")[[1]][1],
         quarter_name = "summer",
         start_date = mdy(start_date),
         weekday = weekdays(start_date),
         cost = as.numeric(cost),
         time_of_day = case_when(
           str_detect(start_time, "AM") ~ "Morning",
           TRUE ~ "Evening"),
         weekday_morning = if_else(weekday %in% c("Monday", "Tuesday", "Wednesday", "Thursday", "Friday") && 
                                     time_of_day == "Morning" &&
                                     location != "ONLINE", 
                                   "Weekday Morning", "Non-Weekday Morning")) %>% 
  select(code, start_time, location, weekday, time_of_day, cost, weekday_morning)


program_data <- offering_data %>% 
  left_join(program_data %>% select(code, name, units, category)) %>% 
  distinct(code, start_time, .keep_all = TRUE) %>% 
  bind_rows(program_data %>% 
              filter(!code %in% offering_data) %>% 
              mutate(start_time = "Unknown",
                     weekday = "Unknown",
                     time_of_day = "Unknown",
                     cost = 0,
                     weekday_morning = "Unknown",
                     location = availability) %>% 
              select(-quarter_name, -availability)) %>% 
  distinct(code, location, .keep_all = TRUE) %>% 
  filter(location != "",
         !str_detect(name, "Info Session")) %>% 
  mutate(location = recode(location,
    ONLINE = "Online",
    `SANTA CLARA` = "Classroom",
    Blended = "Online",
    `Classroom and Online` = "Online"))

program_data

{% endhighlight %}

```
# A tibble: 62 x 10
   code      start_time location  weekday   time_of_day  cost weekday_morning     name                                                  units category
   <chr>     <chr>      <chr>     <chr>     <chr>       <dbl> <chr>               <chr>                                                 <dbl> <chr>   
 1 LINX.X401 09:00 AM   Classroom Saturday  Morning      980. Non-Weekday Morning LAMP: Linux Based Web Application Development – Apac…  3.00 Core    
 2 LINX.X401 12:00 AM   Online    Friday    Morning      980. Non-Weekday Morning LAMP: Linux Based Web Application Development – Apac…  3.00 Core    
 3 IPDV.X405 06:30 PM   Classroom Monday    Evening      960. Non-Weekday Morning JavaScript and AJAX, Comprehensive                     3.00 Core    
 4 CMPR.X412 06:30 PM   Classroom Wednesday Evening      625. Non-Weekday Morning Java Programming for Beginners                         2.00 Elective
 5 CMPR.X412 12:00 AM   Online    Friday    Morning      625. Non-Weekday Morning Java Programming for Beginners                         2.00 Elective
 6 CMPR.X413 06:30 PM   Classroom Monday    Evening     1020. Non-Weekday Morning Java Programming, Comprehensive                        3.00 Elective
 7 CMPR.X413 12:00 AM   Online    Friday    Morning     1020. Non-Weekday Morning Java Programming, Comprehensive                        3.00 Elective
 8 CMPR.X417 12:00 AM   Online    Friday    Morning      625. Non-Weekday Morning XML Essentials                                         2.00 Elective
 9 CMPR.X415 06:30 PM   Classroom Thursday  Evening      580. Non-Weekday Morning Python Programming for Beginners                       1.50 Elective
10 CMPR.X416 09:00 AM   Classroom Monday    Morning     1020. Weekday Morning     Python for Programmers                                 3.00 Elective
# ... with 52 more rows

```

My definition of an “online” course is fairly ridgid. Any course classified “blended” or “Classroom and Online” is re-coded as an online course. 

### The Scheduling “Algorithm”

I omitted some of the quarterly data for reasons I explained above. I never bothered to figure out how to effectively project future quarter dates, which could have been used to calculate time-to-completion. Instead, we’re left with a half-decent approximation. The final scheduling function, `plan_my_program_schedule()` is below. This monstrosity of a function has five parameters: 

* `program_data` -- the scraped program data.
* `days_available` -- a vector indicating the weekdays the student is available.
* `online_willing` -- a boolean indicating whether the student is willing to take online courses.
* `weekday_morning_available` -- a boolean indicating whether the student is available on mornings during the week.
* `cost_threshold` -- the maximum amount of money the student is willing to spend.

In the end, I substituted “algorithm” with a “randomize-combinations-until-it-works” approach. The function first calculates the maximum combinations of six unique courses within the program data. Within the while loop, six random course codes are sampled and then run through a series of checks corresponding to the function inputs. The minimum number of credits (14) is also checked, as is whether or not a “core” class is included in the generated schedule. If the maximum possible combinations are made, the while loop breaks and apologizes to the user. Otherwise, it returns the first combination that passes all checks.

I realize I’m making several assumptions here. For one, I’m assuming that--because JavaScript and AJAX, Comprehensive was offered on Monday evenings at 6:30 in the summer--that it will also be offered at that time in the future. That’s probably inaccurate, but it was a concession I had to make.

{% highlight r %}

plan_my_program_schedule <- function(program_data,
                                     days_available = c("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
                                     online_willing = TRUE,
                                     weekday_morning_available = TRUE,
                                     cost_threshold = 5000) {
  
  max_combinations <- choose(length(unique(program_data$code)), 6)
  cond <- TRUE
  counter <- 0
  while (cond) {
    samp <- sample(unique(program_data$code), 6, replace = FALSE)
    sched <- program_data %>% 
      filter(code %in% samp) %>% 
      distinct(code, .keep_all = TRUE)
    days_available_check <- all(unique(sched$weekday) %in% days_available)
    online_willing_check <- ifelse("Online" %in% sched$location && !online_willing, FALSE, TRUE)
    weekday_morning_check <- ifelse("Weekday Morning" %in% sched$weekday_morning && !weekday_morning_available, FALSE, TRUE)
    cost_threshold_check <- ifelse(sum(sched$cost) > cost_threshold, FALSE, TRUE)
    credits_check <- ifelse(sum(sched$units) < 14, FALSE, TRUE)
    core_check <- ifelse(any(sched$category == "Core"), TRUE, FALSE)
    counter <- counter + 1
    
    if (counter >= max_combinations) {
      message("Sorry, unable to create a schedule with those constraints.")
      cond <- FALSE
    }
    
    if (all(days_available_check, online_willing_check, weekday_morning_check, cost_threshold_check, credits_check, core_check)) {
      message(sprintf("After %d permutations, your schedule is complete!", counter))
      sched <- select(sched, code, name, cost, location, start_time, weekday, units, category)
      if (sum(sched$units) >= 16) {
        es <- sched %>% filter(category == "Elective", units == 2) %>% sample_n(1) %>% pull(code)
        sched <- sched %>% filter(code != es)
      }
      class(sched) <- c("programSchedule", class(sched))
      cond <- FALSE
    }
  }
  sched
}

{% endhighlight %}


Bonus: I wrote a print method!

{% highlight r %}

print.programSchedule <- function(x) {
  cat(paste0("Total cost: $", sum(x$cost), "\n"))
  cat(paste0("Credits earned: ", sum(x$units), "\n"))
  cat("Proposed course schedule:\n")
  cat(rep("-", 40), "\n")
  for (i in seq_along(1:nrow(x))) {
    cat(x$code[i], "- ")
    cat(str_pad(x$name[i], max(nchar(x$name)), side = "right"), "\t", "|")
    cat(paste0("$", x$cost[i], "\t"), "|")
    cat(str_pad(x$location[i], max(nchar(x$location)), side = "right"), "\t", "|")
    cat(x$start_time[i], "\t", "|")
    cat(str_pad(x$weekday[i], max(nchar(x$weekday)), side = "right"), "\t", "|")
    cat(x$units[i], "credits", "\t", "|")
    cat(str_pad(x$category[i], max(nchar(x$category)), side = "right"), "\n")
  }
  cat(rep("\n", 2))
  cat("Visit https://www.ucsc-extension.edu for more information.")
}
{% endhighlight %}

So finally, in the example below, I’m a student interested in the Internet Programming and Development program. I am only available on Mondays, Tuesdays, Wednesdays, and Thursdays. Because I am very old-fashioned, I am not willing to take online courses, nor am I available on weekday mornings. The maximum amount of money I am willing to spend is $5000. What’s my schedule?

{% highlight r %}

plan_my_program_schedule(program_data,
                         days_available = c("Monday", "Tuesday", "Wednesday", "Thursday"), 
                         online_willing = FALSE,
                         weekday_morning_available = FALSE,
                         cost_threshold = 5000)
                         
{% endhighlight %}

```
After 6290 permutations, your schedule is complete!
Total cost: $4865
Credits earned: 14.5
Proposed course schedule:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
IPDV.X405 - JavaScript and AJAX, Comprehensive                            	 |$960	 |Classroom 	 |06:30 PM 	 |Monday    	 |3 credits 	 |Core     
CMPR.X412 - Java Programming for Beginners                                	 |$625	 |Classroom 	 |06:30 PM 	 |Wednesday 	 |2 credits 	 |Elective 
CMPR.X413 - Java Programming, Comprehensive                               	 |$1020	 |Classroom 	 |06:30 PM 	 |Monday    	 |3 credits 	 |Elective 
CMPR.X415 - Python Programming for Beginners                              	 |$580	 |Classroom 	 |06:30 PM 	 |Thursday  	 |1.5 credits 	 |Elective 
IPDV.X408 - Web Application Development Using React, Redux and TypeScript 	 |$770	 |Classroom 	 |06:30 PM 	 |Tuesday   	 |2 credits 	 |Elective 
SEQA.X405 - Web Applications Testing, Comprehensive                       	 |$910	 |Classroom 	 |06:30 PM 	 |Thursday  	 |3 credits 	 |Elective 

 
Visit https://www.ucsc-extension.edu for more information.
```

Nice, it only took 6290 permutations to find it!

### Scaling to Other Programs

With a little bit of effort, you can wrap the above code into several functions and input another program you might be interested in. For example, I scraped the Software Engineering program code for another hypothetical schedule:

{% highlight r %}

plan_my_program_schedule(software_program_data,
                         days_available = c("Monday", "Tuesday", "Wednesday", "Saturday"), 
                         online_willing = TRUE,
                         weekday_morning_available = FALSE,
                         cost_threshold = 6350)
{% endhighlight %}


```
After 206 permutations, your schedule is complete!
Total cost: $4875
Credits earned: 14.5
Proposed course schedule:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
SEQA.X403 - Software Quality Assurance and Testing              	 |$735	 |SANTA CLARA 	 |06:30 PM 	 |Tuesday   	 |2 credits 	 |Core     
CMPR.X405 - Computational Intelligence, Introduction            	 |$730	 |SANTA CLARA 	 |06:30 PM 	 |Wednesday 	 |1.5 credits 	 |Elective 
DBDA.X415 - Relational Database Design and SQL Programming      	 |$910	 |SANTA CLARA 	 |06:30 PM 	 |Monday    	 |3 credits 	 |Elective 
UXWD.X412 - Mobile Interface Design                             	 |$880	 |SANTA CLARA 	 |09:00 AM 	 |Saturday  	 |3 credits 	 |Elective 
IPDV.X404 - Introduction to Web Programming: JavaScript and PHP 	 |$710	 |SANTA CLARA 	 |06:30 PM 	 |Wednesday 	 |2 credits 	 |Elective 
ITEC.X401 - DevOps Technologies                                 	 |$910	 |SANTA CLARA 	 |10:30 AM 	 |Saturday  	 |3 credits 	 |Elective 

 
Visit https://www.ucsc-extension.edu for more information.
```

The end. The lesson, as always, let the computers randomize your decisions. 
