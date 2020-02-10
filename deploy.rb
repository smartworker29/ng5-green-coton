# A really robust and safe deployment script.. what could go wrong
require 'optparse'
require 'nokogiri'
require 'slack-notifier'
environments = [:prod, :bluecotton]

options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: deploy.rb [options]"
  opts.on('-e', '--environment NAME', 'Environment name') do |v|
    options[:environment_name] = v.empty? ? :prod : v.to_sym
  end
end.parse!

raise 'Invalid Environment' unless environments.include? options[:environment_name]

def perl_site_deployment
  puts "Transfering..."
  rsync = system('rsync -av dist/ bc-web-01.bluecotton.com:/datadisk/www/bluecotton.com/public_html/js/svg-designer/')

  index = Nokogiri::HTML(open('./dist/index.html'))
  scripts = index.css('script')
  paths = []

  scripts.each do |script|
    file = script['src'].split('.')[0]
    server_file = '/home/bluecott/public_html/flashless-studio.html'

    puts "Linking...#{script['src']}"
    sed = "sed -i -r 's|<script type=\\\"text/javascript\\\" src=\\\"https://www.bluecotton.com/js/svg-designer" + file + ".(.*).bundle.js\\\"></script>|<script type=\\\"text/javascript\\\" src=\\\"https://www.bluecotton.com/js/svg-designer" + script['src'] + "\\\"></script>|g' #{server_file}"
    puts sed
    system("ssh bc-web-01.bluecotton.com \"#{sed}\"")
  end

  puts "Let make sure everyone knows of your accomplishments..."
  message = "Bluecotton flashless designer has finished deploying. [BFD](https://www.bluecotton.com/flashless-studio.html)"
  notifier = Slack::Notifier.new "https://hooks.slack.com/services/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"
  Slack::Notifier::Util::LinkFormatter.format(message)
  notifier.ping message

  puts "Check your work..."
  system("open -a \"/Applications/Google Chrome.app\" 'https://www.bluecotton.com/flashless-studio.html'")
end

def rails_site_deployment
  puts "Zipping..."
  filename = "release-#{Time.now.to_i}.tar.gz"
  system("tar -czf #{filename} dist/")
  puts "Rsync..."
  system("rsync -v -e ssh #{filename} deployer@beta.bluecotton.com:/datadrive/www/bluecotton/beta/designer-deploys")
  puts "Removing current release"
  system('ssh deployer@beta.bluecotton.com "rm -rf /datadrive/www/bluecotton/beta/current/public/studio/*"')
  puts "Unzipping new release..."
  system('ssh deployer@beta.bluecotton.com "cd /datadrive/www/bluecotton/beta/current/public/studio && tar --strip-components=1 -xzvf /datadrive/www/bluecotton/beta/designer-deploys/' + filename + '"')
  puts "Removing tarball..."
  system("rm #{filename}")
end

puts "Building..."
if options[:environment_name] == :prod
  deploy_url = '/'
else
  deploy_url = '/designer'
end

build = system("ng build --prod -env=#{options[:environment_name]} --deploy-url=#{deploy_url} --aot")

if options[:environment_name] == :prod
  perl_site_deployment
else
  rails_site_deployment
end