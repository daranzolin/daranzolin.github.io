---
layout: post
title:  "Joining a List of Data Frames with purrr::reduce()"
date:   2016-12-10 3:27:02 -0700
categories: Post
tags: R 
---

I've been encountering lists of data frames both at work and at play. Most of the time, I need only bind them together
with `dplyr::bind_rows()` or `purrr::map_df()`. But recently I've needed to *join* them by a shared key. This operation is
more complex. In fact, I admitted defeat earlier this year when I allowed `rcicero::get_official()` to return a list of data frames rather than 
a single, tidy table. Forgiveable at the time, but now I know better.

<!--more-->

For a quick demonstration, let's get our list of data frames:

{% highlight r %}
library(tidyverse)
create_df <- function(x) {
  df <- data.frame(A = letters[1:5],
             B = runif(5),
             C = x)
  names(df)[-1] <- sample(LETTERS[-1], 2) #To ensure different column names after "A"
  return(df)
}

df_list <- 1:3 %>% 
  map(create_df)
 
df_list
[[1]]
  A         D J
1 a 0.3097582 1
2 b 0.3961836 1
3 c 0.6604837 1
4 d 0.8421511 1
5 e 0.3547497 1

[[2]]
  A          G D
1 a 0.33622714 2
2 b 0.20616360 2
3 c 0.03255258 2
4 d 0.74785226 2
5 e 0.39190767 2

[[3]]
  A         E P
1 a 0.8881656 3
2 b 0.6511262 3
3 c 0.5864635 3
4 d 0.8551595 3
5 e 0.6208751 3
{% endhighlight %}

Now we have a list of data frames that share one key column: "A". I needed some programmatic way to join each data frame to the next,
and while cycling through abstractions, I recalled the reduce function from Python, and I was ready to bet my life R had something similar. And we do:
for basers, there's `Reduce()`, but for civilized, tidyverse folk there's `purrr::reduce()`. 

Here's how to create and merge `df_list` together with base R and `Reduce()`:

{% highlight r %}
df_list <- list()
for (i in 1:3) {
  df_list[[i]] <- create_df(i) #Yes, you could also use lapply(1:3, create_df), but I went for maximum ugliness
}
Reduce(function(x, y) merge(x, y, by = "A", all = TRUE), df_list)
{% endhighlight %}

Hideous, right?! Behold the glory of the tidyverse:

{% highlight r %}
1:3 %>% 
  map(create_df) %>% 
  reduce(left_join, by = "A")
  
  A          K R          Q I          P E
1 a 0.73928418 1 0.98996062 2 0.28084510 3
2 b 0.23690265 1 0.14713347 2 0.09790211 3
3 c 0.03932318 1 0.03024889 2 0.22254985 3
4 d 0.44752161 1 0.06377270 2 0.42092912 3
5 e 0.47648939 1 0.96873677 2 0.58043129 3
{% endhighlight %}

There's just no comparison. I need to go back and implement this little trick in [rcicero](https://github.com/daranzolin/rcicero) pronto. 

By way of conclusion, here's an example from my [maxprepsr package](https://github.com/daranzolin/maxprepsr) that I've since learned violates CBS Sports' Terms of Use. Don't do this, but here's the idea:

{% highlight r %}
url %>%
  xml2::read_html() %>%
  rvest::html_nodes(".stats-grid") %>%
  rvest::html_table() %>%
  purrr::map(~ janitor::clean_names(.)) %>% 
  purrr::reduce(dplyr::left_join, by = c("x", "athlete_name")) %>%
  dplyr::filter(!is.na(x))
{% endhighlight %}

That is quite a bit of power with just a dash of tidyverse piping.


