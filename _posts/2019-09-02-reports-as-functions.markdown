---
layout: post
title:  "Turn your Reports into Functions!"
date:   2019-09-03 13:15:02 -0700
categories: Post
tags: R
---

Your reporting infrastructure is like a puzzle: you have to know how the pieces fit. Your ETL scripts are a piece; your table
schema is a piece; your data extraction tools are a piece; and your output is a piece. While brute force and time can wedge
anything together (however crudely), ideally we want as little friction as possible; a dash of package templating + `rmarkdown::render` + `purrr` greases all wheels. In brief, *you will probably want to turn your reports into functions.* Below I'll demonstrate how this works, thus creating a programmatic interface to your reporting infrastructure. That means loops and automation, coding instead of clicking.

<!--more-->

You can follow along by first installing [reportsAsFunctions on GitHub.](https://github.com/daranzolin/reportsAsFunctions) The package contains a paramaterized .Rmd template and a single function, `generate_report`.[^1]
If you are unsure about creating Rmd templates, [Chester Ismay's tutorial is quite good.](http://ismayc.github.io/ecots2k16/template_pkg/) And it is relatively easy [to paramaterize any report, as described by Yihui here.](https://bookdown.org/yihui/rmarkdown/parameterized-reports.html)

[^1]: The function's internals were modeled after Hadley Wickham's ["Joy of Functional Programming" repo.](https://github.com/hadley/joy-of-fp) We're taking the next step and turning it into a package function.

`render` is the engine of `rmarkdown` and [the substance of our generate_report function (see below).](https://github.com/daranzolin/reportsAsFunctions/blob/master/R/generate_report.R) It has three essential arguments: `input`, `output_file`, and `params`. Our function wraps these arguments, abstracting `render` to cover any parameterized template.

{% highlight r %}
generate_report <- function(template_name,
                            output_file,
                            param_list,
                            see_now = FALSE) {
  if (!file.exists("skeleton.Rmd")) {
    copy_skeleton(template_name)
  }
  output_file <- file.path(here::here(), output_file)
  rmarkdown::render(input = "skeleton.Rmd", output_file = output_file, params = param_list)
  if (see_now) browseURL(output_file)
}
{% endhighlight %}

### The Input File

Assuming you've already created and packaged an .Rmd template with parameters, the `skeleton.Rmd` file from
`{package_name}/inst/rmarkdown/templates/{name_of_tempate}/skeleton.Rmd` is the first argument to `render`.
Thus, you need to access the file paths of your installed package. Here I created a helper function to
the path of any of my templates:

{% highlight r %}
template_path <- function(template_name) file.path(.libPaths(), "reportsAsFunctions",
                                     "rmarkdown", "templates", template_name,
                                     "skeleton", "skeleton.Rmd")
{% endhighlight %}

The function has one parameter, `report_name`, so it can reference multiple report templates (should they exist). 

It would be great if we could just pass the installed package file path to `render`, but [there appears to be a Pandoc bug 
preventing us from doing so.](https://github.com/rstudio/rmarkdown/issues/1268) The solution is to copy the template to your working
directory and reference it there. That means another helper function:

{% highlight r %}
copy_skeleton <- function(template_name) {
  p <- template_path(template_name)
  invisible(file.copy(p, here::here()))
}
{% endhighlight %}

### The Output File

You need to specify the output file name and extention, e.g. "report_name.html". My templates are all HTML outputs (as specified within the YAML) but you could hypothetically add a third argument, `output_format` to toggle between HTML, PDF, docx, etc. You could also fiddle with the output
location, but I work almost exclusively within projects, so `here::here()` is a sensible setting.

### Parameters

It is relatively simple to set up parameters, [as described by Yihui here.](https://bookdown.org/yihui/rmarkdown/parameterized-reports.html) The lone requirement is that they are a named list. 

Finally, we can call our function. Note that "report" is the name of this particular template.

{% highlight r %}
generate_report("report", "setosa-report.html", param_list = list(species = "setosa"))
{% endhighlight %}

The rendered output should appear in your project's root directory. The additional `see_now` parameter is mostly for
convenience, opening your browser if you want to see the output immediately.

### Looping

The real power of reports as functions comes from this parameterization. Here I loop through and generate a report for each species:

{% highlight r %}
library(purrr)
iris_species <- unique(iris$Species)
out_files <- sprintf("%s-report.html", iris_species)
params <- map(iris_species, ~list(species = .x))
walk2(out_files, params, ~generate_report("report", output_file = .x, param_list = .y))
{% endhighlight %}

Three reports for three species isn't a lot, but how about 50 reports for 50 clients? The lessons, as always, figure out something once,
then scale and automate. Make the pieces fit!