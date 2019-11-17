{
    if ($0 ~ /^#include/) {importfile=gensub(/^#include "([^"]+)"/, "\\1", "g")
        while ((getline line < importfile) > 0)
            print line
        close(importfile)
    } else
        print
}
