# Local Jekyll wrapper tasks.
#
# Why this exists: the `github-pages` gem pins jekyll-sass-converter 1.5.2,
# which reads SCSS files via the process's default external encoding. When the
# shell locale is C / US-ASCII (common in minimal terminal environments),
# UTF-8 characters in jekyll-theme-primer's SCSS crash the build with
# "Invalid US-ASCII character \xE2".
#
# Setting RUBYOPT='-Eutf-8:utf-8' here forces Ruby to use UTF-8 as the default
# external/internal encoding before bundler/Jekyll start, fixing the issue
# regardless of the user's shell locale.
ENV["RUBYOPT"] = [ENV["RUBYOPT"], "-Eutf-8:utf-8"].compact.join(" ").strip

task default: :serve

desc "Build the site into _site/"
task :build do
  sh "bundle exec jekyll build"
end

desc "Serve the site locally with live reload"
task :serve do
  sh "bundle exec jekyll serve --livereload"
end

desc "Build and exit non-zero on warnings (mirrors CI)"
task :ci do
  sh "bundle exec jekyll build --strict_front_matter"
end

desc "Remove generated _site/ and Jekyll caches"
task :clean do
  sh "bundle exec jekyll clean"
end
