<?php
    $username = "root";
    $password = "(l)rob!8";
    $host = "localhost";
    $database="emrtenant20";

    $server = mysql_connect($host, $username, $password);
    $connection = mysql_select_db($database, $server);

    echo("run");

    $myquery = "
SELECT  `resultentry_pk`, `value` FROM  `medical_resultvalue`
";
    $query = mysql_query($myquery);

    if ( ! $query ) {
        echo mysql_error();
        die;
    }

    $data = array();

    for ($x = 0; $x < mysql_num_rows($query); $x++) {
        $data[] = mysql_fetch_assoc($query);
    }

    echo json_encode($data);

    mysql_close($server);
?>
