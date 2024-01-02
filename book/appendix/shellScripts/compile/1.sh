OPTSTRING="-o i:o:IdDs -l std:"

options=$(getopt $OPTSTRING "$@")
set -- $options
while [ -n "$1" ];do
    case "$1" in
        --)
            echo "--" $1;
            shift 1
            ;;
        *)
            echo "*)" $1;
            shift 1
            ;;
    esac
done

