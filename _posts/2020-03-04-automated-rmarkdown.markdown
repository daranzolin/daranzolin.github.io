---
layout: post
title:  "Automating Rmarkdown Reporting"
date:   2020-03-03 13:15:02 -0700
categories: Post
tags: R
---

There's been some recent commotion about automating Rmarkdown reports. And surprisingly, there isn't (yet) an RStudio-sanctioned method of doing so. We've been left to our own devices, at least for the moment. 

Here I'll share our office's approach to automated Rmarkdown reporting [via the funcreporter package.](https://github.com/ir-sfsu/funcreporter) It's not the only approach, and it might not even be the best one, but it works. The infrastructure is mostly in place via rmarkdown, usethis, and devtools; we only had to put it all together.

## Create your Reporting Package

First, create a package that contains your RMarkdown reports, parameterized or not. I won't go over package development here, but adding templates to a package is trivial: use `usethis::use_rmarkdown_template` and you're good to go. Follow [the mechanics of parameterized reporting here.](https://bookdown.org/yihui/rmarkdown/parameterized-reports.html)

Before we get to funcreporter, there's a little demo package called funcreports to give you an idea of what a reporting package looks like. If you want to follow along, install it with:

{% highlight r %}
remotes::install_github("daranzolin/funcreports")
{% endhighlight %} 

Note how each RMarkdown template has a `skeleton.Rmd` in a separte folder in the directory tree:

```
├── DESCRIPTION
├── LICENSE
├── LICENSE.md
├── NAMESPACE
├── R
│   └── hello.R
├── README.md
├── funcreports.Rproj
├── inst
│   └── rmarkdown
│       └── templates
│           ├── sample-1
│           │   ├── skeleton
│           │   │   └── skeleton.Rmd
│           │   └── template.yaml
│           ├── sample-2
│           │   ├── skeleton
│           │   │   └── skeleton.Rmd
│           │   └── template.yaml
│           └── sample-3
│               ├── skeleton
│               │   └── skeleton.Rmd
│               └── template.yaml
```

## Install and set up funcreporter

After you've created your reporting package (or installed funcreports), install funcreporter:

{% highlight r %}
remotes::install_github("ir-sfsu/funcreporter)
{% endhighlight %}

funcreporter is really just a wrapper that coordinates some logistics between your `.Renviron`, `.libPaths`, `rmarkdown::render`, and `here::here`. But first it has to know which package to use for reporting:

{% highlight r %}
library(funcreporter)
set_funcreporter_pkg("funcreports")

Setting env var FUNCREPORTER_PKG=funcreports
Setting env var FUNCREPORTER_PATH_TO_TEMPLATES=/Library/Frameworks/R.framework/Versions/4.0/Resources/library/funcreports/rmarkdown/templates
{% endhighlight %}

## funcreport!

Now you just need to know the names of your reports and the associated parameters. Here I'll run the "Sample 1" report you can see in the tree directory above (the .yaml file title):

{% highlight r %}
funcreporter(
  template_name = "Sample 2", 
  output_file = "carb-report",
  params = list(cyl = 6)
)
{% endhighlight %}

Nothing special in and of itself. But funcreporter's `params` argument can take list values of length *greater than 1,* meaning you can render any number of reports with a single function call. Here I'll run the "Sample 1" report for all three iris species, setting an additional breaks parameter to 15 and adjusting a plot title accordingly:

{% highlight r %}
species <- unique(iris$Species)
funcreporter(
  template_name = "Sample 1",
  output_file = paste0(species, "-report"),
  params = list(species = species, breaks = 15, plot_title = paste(species, "Distribution"))
)
{% endhighlight %}

Now *that's* power! Three reports for three species isn't much, but how about 100 reports for 100 clients? 

Give funcreporter a whirl, and let me know if it works.
