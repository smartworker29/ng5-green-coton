#!/usr/bin/env ruby

FOLDER='/Users/brady.somerville/Desktop/clipart'
INKSCAPE='/usr/local/bin/inkscape'
RECREATE=false

Dir.glob("#{FOLDER}/**/*.eps").each do |file|
  svg_file = file.gsub(/\.eps$/, '.svg')

  puts "eps file: #{file}"
  puts "svg file: #{svg_file}"

  if RECREATE
    File.delete(svg_file) if File.exists?(svg_file)
  else
    next if File.exists?(svg_file)
  end

  errors = []

  begin
    system INKSCAPE, file,
      '--export-ignore-filters',
      '--vacuum-defs',
      '-l', svg_file # export as a plain svg to this path

    # now, we need to fix up the svg file
    svg_contents = File.read(svg_file)

    # if defs is empty, either remove it or give it a proper closing tag
    svg_contents.gsub!(/<defs\s+id="(.*?)"\s+\/>/, '<defs id="\1"></defs>')

    # if there's a 1x1 image, remove it because it's not supposed to be there
    svg_contents.gsub!(/<image.*?height="1".*?width="1".*?\/>/m, '')

    # now save the svg
    open(svg_file, 'w') do |f|
      f.puts svg_contents
    end

  rescue Exception => e
    errors << e
  end

  if errors.any?
    puts "The following errors occurred:"
    errors.each do |error|
      puts "\t#{error}"
    end
  end
end
