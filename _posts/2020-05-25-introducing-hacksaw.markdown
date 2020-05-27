---
layout: post
title:  "Introducing the hacksaw package"
date:   2020-05-25 13:15:02 -0700
categories: Post
tags: R
---
 
Moving between dplyr and purrr is usually a delight. There are, however, some exceptions that led to the creation of [{hacksaw}, my new package for extra tidyverse-like functionality.](https://github.com/daranzolin/hacksaw) Splitting and mapping over data frames has never been easier.

<!--more-->

For example, last week's #tidytuesday dataset featured beach volleyball matches from around the world. The untided data was *65 columns wide* and required some reshaping for summary operations. My plan was to calculate average height by country, but the players' names, heights, and countries were stretched out over multiple columns; I needed them in one column each.

Obviously, there are a couple ways to approach this. The most straightforward (albeit brutish) way, IMO, is to select out the columns, stack them on top of each other, and take the distinct rows before summarizing. I don't doubt that a pivoting/gathering master could achieve the same result, but that's not how my mind works in cases like these. 

So here's the original brutish way, manually creating three different objects off the base table:

{% highlight r %}
library(tidyverse)
vb_matches <- read_csv('https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-05-19/vb_matches.csv', guess_max = 76000)

womens_matches <- vb_matches %>% filter(gender == "W")

player <- womens_matches %>% 
  select(matches("_player[12]")) %>% 
  map(unlist) %>% 
  flatten_chr() 

height <- womens_matches %>% 
  select(matches("hgt")) %>% 
  map(unlist) %>% 
  flatten_dbl() 

country <- womens_matches %>% 
  select(matches("_country")) %>% 
  map(unlist) %>% 
  flatten_chr() 

avg_height <- bind_cols(player = player, height = height, country = country) %>% 
  distinct() %>% 
  group_by(country) %>%
  summarize(avg_height = mean(height, na.rm = TRUE))

avg_height
{% endhighlight %}

```
# A tibble: 95 x 2
   country        avg_height
   <chr>               <dbl>
 1 Algeria              68.5
 2 Argentina            69  
 3 Australia            70.5
 4 Austria              69.6
 5 Azerbaijan           70.8
 6 Belarus              70.7
 7 Belgium              71.6
 8 Brazil               69.8
 9 Bulgaria             71.1
10 CÃ´te d'Ivoire      NaN  
# … with 85 more rows
```

I don't know about you but that is *annoying* to type out. I think you'll find the alternative with {hawksaw} much cleaner:

{% highlight r %}
library(hacksaw)

avg_height <- vb_matches %>%
  filter(gender == "W") %>%
  select_split(player = matches("_player[12]"), 
               height = matches("hgt"), 
               country = matches("_country")) %>%
  map_dfc(unlist) %>%
  distinct() %>%
  group_by(country) %>%
  summarize(avg_height = mean(height, na.rm = TRUE))
{% endhighlight %}

What happened inside of `select_split`? I defined three selections and iterated over the data frame, adding each selection to a list that gets piped into `map_dfc`.

{hawksaw} also has `filter_split` for when you want to split a data frame into a list in a more precise way than `base::split`. I love pairing it with the awesome {zeallot} package:

{% highlight r %}
library(zeallot)

iris %>% 
  filter_split(Petal.Length > 5.1,
               Sepal.Length > 6.4) %->% c(large_petals, large_sepals)
{% endhighlight %}

There's also `distinct_split` which returns the unique values of specified columns (in a list). One example would be easily checking the number of unique values across columns:

{% highlight r %}
starwars %>% 
  distinct_split(name, skin_color, eye_color) %>% 
  lengths()
{% endhighlight %}

```
87 31 15 
```

Something else I was tired of doing was typing `mutate(..., var = as.character(var), var2 = as.numeric(var2))` so I have some casting functions that are wrappers around `mutate_at`:

{% highlight r %}
starwars %>% cast_character(height, mass) %>% str(max.level = 2) 
{% endhighlight %}

```
tibble [87 × 13] (S3: tbl_df/tbl/data.frame)
 $ name      : chr [1:87] "Luke Skywalker" "C-3PO" "R2-D2" "Darth Vader" ...
 $ height    : chr [1:87] "172" "167" "96" "202" ...
 $ mass      : chr [1:87] "77" "75" "32" "136" ...
 $ hair_color: chr [1:87] "blond" NA NA "none" ...
 $ skin_color: chr [1:87] "fair" "gold" "white, blue" "white" ...
 $ eye_color : chr [1:87] "blue" "yellow" "red" "yellow" ...
 $ birth_year: num [1:87] 19 112 33 41.9 19 52 47 NA 24 57 ...
 $ gender    : chr [1:87] "male" NA NA "male" ...
 $ homeworld : chr [1:87] "Tatooine" "Tatooine" "Naboo" "Tatooine" ...
 $ species   : chr [1:87] "Human" "Droid" "Droid" "Human" ...
 $ films     :List of 87
 $ vehicles  :List of 87
 $ starships :List of 87
```

{% highlight r %}
iris %>% cast_character(contains(".")) %>% str(max.level = 1)
{% endhighlight %}

```
'data.frame':	150 obs. of  5 variables:
 $ Sepal.Length: chr  "5.1" "4.9" "4.7" "4.6" ...
 $ Sepal.Width : chr  "3.5" "3" "3.2" "3.1" ...
 $ Petal.Length: chr  "1.4" "1.4" "1.3" "1.5" ...
 $ Petal.Width : chr  "0.2" "0.2" "0.2" "0.2" ...
 $ Species     : Factor w/ 3 levels "setosa","versicolor",..: 1 1 1 1 1 1 1 1 1 1 ...
```

{hacksaw} can also shift values across rows in either direction:

{% highlight r %}
df <- data.frame(
  s = c(NA, 1, NA, NA),
  t = c(NA, NA, 1, NA),
  u = c(NA, NA, 2, 5),
  v = c(5, 1, 9, 2),
  x = c(1, 5, 6, 7),
  y = c(NA, NA, 8, NA),
  z = 1:4
)
{% endhighlight %}

```
df
   s  t  u v x  y z
1 NA NA NA 5 1 NA 1
2  1 NA NA 1 5 NA 2
3 NA  1  2 9 6  8 3
4 NA NA  5 2 7 NA 4

shift_row_values(df)
  s t u  v  x  y  z
1 5 1 1 NA NA NA NA
2 1 1 5  2 NA NA NA
3 1 2 9  6  8  3 NA
4 5 2 7  4 NA NA NA

shift_row_values(df, at = 1:3)
   s  t u  v  x  y  z
1  5  1 1 NA NA NA NA
2  1  1 5  2 NA NA NA
3  1  2 9  6  8  3 NA
4 NA NA 5  2  7 NA  4

shift_row_values(df, at = 1:2, .dir = "right")
   s  t  u  v x  y z
1 NA NA NA NA 5  1 1
2 NA NA NA  1 1  5 2
3 NA  1  2  9 6  8 3
4 NA NA  5  2 7 NA 4
```

And finally, I work with data that is often riddled with NAs, and I need to locate them quickly. `keep_na` is the reverse of `tidyr::drop_na`:

{% highlight r %}
df <- tibble(x = c(1, 2, NA, NA), y = c("a", NA, "b", NA))
df %>% keep_na(x)
{% endhighlight %}

```
# A tibble: 2 x 2
      x y    
  <dbl> <chr>
1    NA b    
2    NA NA   
```

{% highlight r %}
df %>% keep_na(x, y)
{% endhighlight %}

```
# A tibble: 1 x 2
      x y    
  <dbl> <chr>
1    NA NA  
```
This is much faster than `filter(is.na(...), is.na(...) ...)` etc.