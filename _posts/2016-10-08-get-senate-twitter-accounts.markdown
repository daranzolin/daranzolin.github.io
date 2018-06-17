---
layout: post
title:  "US Senator Tweets, Part I"
date:   2016-10-08 20:36:02 -0700
categories: Tutorial
tags: rcicero R twitter politics
---

I spent the majority of the most recent presidential debate thinking of a fun #rstats project. I had three objectives for the post:
(1) that it be fun to do; (2) that it showcase some functionality of `rcicero` or `rcanvas`; and (3) that it be interesting 
to the public. The third objective was admittedly negotiable.

<!--more-->

In the next two posts, I'm going to analyze the tweets from our US senators in response to #debate. Part I will show how to obtain each
senator's twitter account with the `rcicero` package, and Part II will perform some basic text analysis on the corpus of tweets with the awesome `rtweet` package.

### Prep Work

`rcicero` requires some prep work before use which [I've spelled out on the package's GitHub README.](https://github.com/daranzolin/rcicero) Let's
jump right in:

{% highlight r %}
library(rcicero)
library(tidyverse)
set_token_and_user("Your_Cicero_Account_Name", "Your_Cicero_Account_Password")
Your Cicero API user and token options have been set.
{% endhighlight %}

To get the twitter accounts, I needed a pair of longitude and latitude coordinates from each state, so I just grabbed 
some from the `zipcodes` package:

{% highlight r %}
library(zipcodes)
data(zipcode)
coords <- zipcode %>% 
  group_by(state) %>% 
  slice(1) %>% 
  filter(!is.na(latitude))
{% endhighlight %}

### Get the Twitter Handles 

Now I need to pass each pair of coordinates through the Cicero API with a custom function that gets each senator's twitter account, and,
just for fun, their party:

{% highlight r %}
get_party_and_twitter_account <- function(lat, lon, district_type) {
  x <- get_official(lat = lat, lon = lon, district_type = district_type) #FYI get_official() returns a list of data.frames
  twitters <- x$identifiers %>% 
    select(last_name, first_name, identifier, identifier_type) %>% 
    filter(identifier_type == "TWITTER")
  parties <- x$gen_info %>% 
    select(last_name, first_name, party)
  left_join(twitters, parties)
}
{% endhighlight %}

### Iterate

With our custom function in hand, it's time to iterate with the `purrr` package which is so beautiful and elegant, I can't even bear to look at some of my old code. Warning: the code below is fairly expensive--it will run you about 59 Cicero API credits. 

{% highlight r %}
safe_function <- possibly(get_party_and_twitter_account, NULL)
args <- list(coords$latitude,
             coords$longitude,
             "NATIONAL_UPPER")
twitter_accounts <- args %>% 
  pmap(safe_function) %>% #FYI we're passing three arguments into the safe function here
  bind_rows()
{% endhighlight %}

Voila! Our `twitter_accounts` `data.frame` now has each senator's last_name, first_name, twitter handle, and party:

{% highlight r %}
head(twitter_accounts)
Source: local data frame [6 x 5]

  last_name first_name      identifier identifier_type      party
      <chr>      <chr>           <chr>           <chr>      <chr>
1 Murkowski       Lisa   lisamurkowski         TWITTER Republican
2  Sullivan     Daniel  SenDanSullivan         TWITTER Republican
3  Sessions  Jefferson senatorsessions         TWITTER Republican
4    Shelby    Richard       SenShelby         TWITTER Republican
5   Boozman       John     JohnBoozman         TWITTER Republican
6    Cotton        Tom     tomcottonar         TWITTER Republican
{% endhighlight %}
Stay tuned for Part II.




